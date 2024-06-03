const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

//setting up the Coupon model for the database
const Coupon = sequelize.define("Coupon", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
      min: 1,
    },
  },
  productPhoto: {
    type: DataTypes.STRING,
    allowNull: true, // Product photo may be mandatory
    validate: {
      isFilePath(value) {
        if (value && !value.match(/(\.jpg|\.jpeg|\.png)$/i)) {
          throw new Error(
            "Product photo must be a valid .jpg, .jpeg, or .png file path"
          );
        }
      },
    },
  },
  companyLogo: {
    type: DataTypes.STRING,
    allowNull: true, // Company logo may be mandatory
    validate: {
      isFilePath(value) {
        if (value && !value.match(/(\.jpg|\.jpeg|\.png)$/i)) {
          throw new Error(
            "Company logo must be a valid .jpg, .jpeg, or .png file path"
          );
        }
      },
    },
  },
  productCategory: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  validity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  creator: {
    type: DataTypes.STRING,
    allowNull: true, //for now thats fine, but later we should make it mandatory
  },
  product: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isFloat: true,
      min: 0,
    },
  },
  new_price: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      isFloat: true,
      min: 0,
    },
  },
  discount: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      isFloat: true,
      min: 0,
    },
  },
  productInfo: {
    type: DataTypes.STRING,
    allowNull: true,
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

module.exports = Coupon;
