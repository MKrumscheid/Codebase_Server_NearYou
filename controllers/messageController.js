const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Message = require("../models/Message");
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

//Method to get all messages within the user specified distance
exports.findNearbyMessages = async (req, res) => {
  const { latitude, longitude, distance = 500 } = req.query;
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

  try {
    const messages = await Message.findAll({
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
    });
    res.send(messages);
  } catch (error) {
    console.error("Error finding messages:", error);
    res.status(500).send({ message: "Error finding messages", error });
  }
};

// Method to create a new message
exports.createMessage = async (req, res, next) => {
  try {
    const { content, latitude, longitude } = req.body;

    const newMessage = await Message.create({
      content,
      location: sequelize.fn("ST_MakePoint", longitude, latitude),
      createdAt: new Date(),
    });

    res.status(201).send(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    next(error);
  }
};

// Method to delete messages older than 12 hours
exports.deleteOldMessages = async (req, res) => {
  const twelveHoursAgo = new Date(new Date().getTime() - 12 * 60 * 60 * 1000);

  try {
    await Message.destroy({
      where: {
        createdAt: { [Op.lt]: twelveHoursAgo },
      },
    });
    res.send({ message: "Old messages deleted successfully" });
  } catch (error) {
    console.error("Error deleting old messages:", error);
    res.status(500).send({ message: "Error deleting old messages", error });
  }
};
