const { Message } = require("../models/Message");
const sequelize = require("sequelize");
const { Op } = sequelize;

// Remove expired messages
const handleExpiredMessages = async (transaction) => {
  await Message.destroy({
    where: {
      expiration: { [Op.lt]: new Date() },
    },
    transaction,
  });
};

exports.createMessage = async (req, res) => {
  const transaction = await sequelize.Transaction();
  try {
    const { content, latitude, longitude } = req.body;
    const newMessage = await Message.create(
      {
        content: content,
        location: sequelize.fn("ST_MakePoint", longitude, latitude),
        expiration: new Date(new Date().getTime() + 15 * 60000),
      },
      { transaction }
    );

    await transaction.commit();
    res.status(201).json(newMessage);
  } catch (error) {
    await transaction.rollback();
    res
      .status(500)
      .json({
        message: "Fehler beim Erstellen der Nachricht",
        error: error.message,
      });
  }
};

exports.findNearbyMessages = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { latitude, longitude } = req.query;
    await handleExpiredMessages(transaction);

    const messages = await Message.findAll({
      where: sequelize.where(
        sequelize.fn(
          "ST_Distance_Sphere",
          sequelize.literal(`POINT(${longitude}, ${latitude})`),
          sequelize.col("location")
        ),
        { [Op.lte]: 300 } //messages shall always have a reach of 300 meters for this implementation. lte = less than or equal
      ),
      transaction,
    });

    await transaction.commit();
    res.json(messages);
  } catch (error) {
    await transaction.rollback();
    res
      .status(500)
      .json({
        message: "Fehler beim finden von Nachrichten in der Nähe",
        error: error.message,
      });
  }
};
