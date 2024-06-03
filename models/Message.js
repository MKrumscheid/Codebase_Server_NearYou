const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

//setting up the Message model for the database
const Message = sequelize.define("Message", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.GEOMETRY("POINT"),
    allowNull: false,
  },
  expiration: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

module.exports = Message;
