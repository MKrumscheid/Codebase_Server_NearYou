const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Coupon = require("../models/Coupon");
const Op = Sequelize.Op;

// Utility functions
function isValidLatitude(lat) {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lon) {
  return lon >= -180 && lon <= 180;
}

function isValidDistance(distance) {
  return distance >= 50 && distance <= 5000;
}

// Remove expired coupons
const handleExpiredCoupons = async (transaction) => {
  await Coupon.destroy({
    where: {
      expiration: { [Op.lt]: new Date() }, //Op.lt means Operation less than
    },
    transaction,
  });
};

exports.getCouponByID = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).send({ message: "Coupon not found" });
    }
    res.send(coupon);
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res
      .status(500)
      .send({ message: "Failed to retrieve coupon", error: error.message });
  }
};

// Fetch and return nearby coupons
async function fetchAndReturnNearbyCoupons(
  res,
  latitude,
  longitude,
  distance,
  transaction
) {
  if (
    !isValidLatitude(latitude) ||
    !isValidLongitude(longitude) ||
    !isValidDistance(distance)
  ) {
    return res.status(400).send({
      message:
        "Invalid input parameters. Please check your position and distance data.",
    });
  }

  await handleExpiredCoupons(transaction);

  try {
    const coupons = await Coupon.findAll({
      where: sequelize.where(
        sequelize.fn(
          "ST_DistanceSphere",
          sequelize.fn(
            "ST_SetSRID",
            sequelize.fn("ST_MakePoint", longitude, latitude),
            4326
          ),
          sequelize.col("location")
        ),
        { [Op.lte]: parseInt(distance) }
      ),
      transaction,
    });
    res.send(coupons);
  } catch (error) {
    console.error("Error finding coupons:", error);
    res.status(500).send({ message: "Error finding coupons", error });
  }
}

// Controller methods with transactions
exports.createCoupon = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    console.log(req.body.jsonData);
    const {
      productCategory,
      validity,
      price,
      discount,
      productInfo,
      latitude,
      longitude,
      product,
      quantity,
    } = req.body;
    const productPhoto = req.files?.productPhoto
      ? req.files.productPhoto[0].path
      : null;
    const companyLogo = req.files?.companyLogo
      ? req.files.companyLogo[0].path
      : null;

    const newCoupon = await Coupon.create(
      {
        productPhoto,
        companyLogo,
        productCategory,
        validity,
        product,
        price,
        quantity,
        new_price: price - (price * discount) / 100,
        discount,
        productInfo,
        location: sequelize.fn("ST_MakePoint", longitude, latitude),
        expiration: new Date(new Date().getTime() + 24 * 60 * 60000),
      },
      { transaction }
    );

    await transaction.commit();
    res
      .status(201)
      .send({ message: `Created Coupon with ID ${newCoupon.id} successfully` });
  } catch (error) {
    if (transaction.finished !== "commit") {
      // Rollback only if the transaction hasn't been committed
      await transaction.rollback();
    }
    console.error("Error during coupon creation: ", error);
    next(error); //pass the error to the error handler middleware (multer error handler in this case)
    res
      .status(500)
      .send({ message: "Error creating coupon", error: error.toString() });
  }
};

//probably never being used...but here we go
exports.updateCoupon = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      id,
      productCategory,
      validity,
      price,
      discount,
      product,
      productInfo,
      latitude,
      longitude,
      expiration,
      quantity,
    } = req.body.jsonData;
    const productPhoto = req.files?.productPhoto
      ? req.files.productPhoto[0].path
      : null; //maybe use a placeholder image if no image is uploaded instead of null
    const companyLogo = req.files?.companyLogo
      ? req.files.companyLogo[0].path
      : null;

    const updatedFields = {
      productCategory,
      validity,
      price,
      quantity,
      product,
      new_price: price - (price * discount) / 100,
      discount,
      productInfo,
      location: sequelize.fn("ST_MakePoint", longitude, latitude),
      expiration,
    };

    // Only update image paths if new images were uploaded (not strictly speaking a PUT request anymore, but trying to avoid sending the images if it isnt necessary)
    if (productPhoto) updatedFields.productPhoto = productPhoto;
    if (companyLogo) updatedFields.companyLogo = companyLogo;

    const [updated] = await Coupon.update(updatedFields, {
      where: { id },
      transaction,
    }); //update method returns an array with the number of updated rows, we deconstruct it to get the first element
    if (updated === 0) {
      await transaction.rollback();
      return res.status(404).send({ message: "Coupon not found" });
    }

    await transaction.commit();
    res.send({ message: "Coupon updated successfully" });
  } catch (error) {
    await transaction.rollback();
    res
      .status(400)
      .send({ message: "Error updating coupon", error: error.message });
  }
};

// also never really used, since we dont have a user authentification and anyone would be able to delete any coupon, just to show of we can do it
exports.deleteCoupon = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params; //destructure the id from req.params (which could look like {id: "123"})

    const result = await Coupon.destroy({ where: { id }, transaction });
    if (result === 0) {
      await transaction.rollback();
      return res.status(404).send({ message: "Coupon not found" });
    }

    await transaction.commit();
    res.send({ message: "Coupon deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    res
      .status(500)
      .send({ message: "Error deleting coupon", error: error.message });
  }
};

// maybe also use patch in case a coupon got sent  back from a client after its validation ran out. Use req.route.path to check route path
exports.patchCoupon = async (req, res) => {
  //patch is only used to update the quantity of a coupon!
  const t = await sequelize.transaction();
  try {
    const coupon = await Coupon.findByPk(req.params.id, { transaction: t });
    if (!coupon) {
      await t.rollback();
      return res.status(404).send({ message: "No coupons left to claim" });
    }

    // Check if it's the last coupon
    if (coupon.quantity === 1) {
      await coupon.destroy({ transaction: t });
    } else {
      // Decrement the quantity if more than one left
      coupon.quantity -= 1;
      await coupon.save({ transaction: t });
    }

    await t.commit();
    res.send({
      message: "Coupon claimed successfully",
      remainingQuantity: coupon.quantity,
    });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .send({ message: "Failed to claim coupon", error: error.message });
  }
};

exports.findNearbyCoupons = async (req, res) => {
  const { latitude, longitude, distance = 500 } = req.query;
  console.log(latitude, latitude, distance);
  await fetchAndReturnNearbyCoupons(res, latitude, longitude, distance);
};
