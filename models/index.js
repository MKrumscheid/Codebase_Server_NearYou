const sequelize = require("../config/database"); // The Sequelize connection instance
const Coupon = require("./Coupon");
const Message = require("./Message");

// Check and sync all models
const setupDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    sequelize
      .authenticate()
      .then(() => {
        console.log("Connection has been established successfully.");
      })
      .catch((err) => {
        console.error("Unable to connect to the database:", err);
      });
  } catch (error) {
    console.error("Unable to synchronize database:", error);
  }
};

module.exports = {
  Coupon,
  Message,
  setupDatabase,
};
