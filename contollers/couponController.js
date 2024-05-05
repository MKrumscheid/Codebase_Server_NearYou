const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../database'); // Adjust this path according to your setup
const Coupon = require('../models/Coupon');
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
            expiration: { [Op.lt]: new Date() }
        },
        transaction
    });
};

// Fetch and return nearby coupons
async function fetchAndReturnNearbyCoupons(res, latitude, longitude, distance, transaction) {
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude) || !isValidDistance(distance)) {
        return res.status(400).send({ message: 'Invalid input parameters. Please check your position and distance data.' });
    }

    await handleExpiredCoupons(transaction);

    try {
        const coupons = await Coupon.findAll({
            where: sequelize.where(
                sequelize.fn('ST_Distance_Sphere',
                    sequelize.literal(`POINT(${longitude}, ${latitude})`),
                    sequelize.col('location')),
                { [Op.lte]: parseInt(distance) }
            ),
            transaction
        });
        res.send(coupons);
    } catch (error) {
        res.status(500).send({ message: 'Error finding coupons', error });
    }
}

// Controller methods with transactions
exports.createCoupon = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { productCategory, validity, creator, price, discount, productInfo, latitude, longitude, expiration } = req.body;
        const productPhoto = req.files?.productPhoto ? req.files.productPhoto[0].path : null;
        const companyLogo = req.files?.companyLogo ? req.files.companyLogo[0].path : null;

        const newCoupon = await Coupon.create({
            productPhoto,
            companyLogo,
            productCategory,
            validity,
            creator,
            price,
            new_price: price - (price * discount / 100), // Calculate new price based on discount (if available)
            discount,
            productInfo,
            location: sequelize.fn('ST_MakePoint', longitude, latitude),
            expiration
        }, { transaction });

        await fetchAndReturnNearbyCoupons(res, latitude, longitude, req.body.distance || 500, transaction);

        await transaction.commit();
        res.status(201);
    } catch (error) {
        await transaction.rollback();
        res.status(400).send({ message: 'Error creating coupon', error: error.message });
    }
};

exports.updateCoupon = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id, productCategory, validity, creator, price, discount, productInfo, latitude, longitude, expiration } = req.body;
        const productPhoto = req.files?.productPhoto ? req.files.productPhoto[0].path : null;
        const companyLogo = req.files?.companyLogo ? req.files.companyLogo[0].path : null;

        const updatedFields = {
            productCategory,
            validity,
            creator,
            price,
            new_price: price - (price * discount / 100), 
            discount,
            productInfo,
            location: sequelize.fn('ST_MakePoint', longitude, latitude),
            expiration
        };

        // Only update image paths if new images were uploaded
        if (productPhoto) updatedFields.productPhoto = productPhoto;
        if (companyLogo) updatedFields.companyLogo = companyLogo;

        const [updated] = await Coupon.update(updatedFields, { where: { id }, transaction });
        if (updated === 0) {
            await transaction.rollback();
            return res.status(404).send({ message: 'Coupon not found' });
        }

        await fetchAndReturnNearbyCoupons(res, latitude, longitude, req.body.distance || 500, transaction);

        await transaction.commit();
        res.send({ message: 'Coupon updated successfully' });
    } catch (error) {
        await transaction.rollback();
        res.status(400).send({ message: 'Error updating coupon', error: error.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;

        const result = await Coupon.destroy({ where: { id }, transaction });
        if (result === 0) {
            await transaction.rollback();
            return res.status(404).send({ message: 'Coupon not found' });
        }

        await transaction.commit();
        res.send({ message: 'Coupon deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).send({ message: 'Error deleting coupon', error: error.message });
    }
};

exports.findNearbyCoupons = async (req, res) => {
    const { latitude, longitude, distance = 500 } = req.query;
    await fetchAndReturnNearbyCoupons(res, latitude, longitude, distance);
};
