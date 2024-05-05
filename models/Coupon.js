const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('./database');  // Ensure this path correctly points to your database configuration

const Coupon = sequelize.define('Coupon', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    productPhoto: { 
        type: DataTypes.STRING,
        allowNull: true,  // Product photo may not be mandatory
        validate: {
            isFilePath(value) {
                if (value && !value.match(/(\.jpg|\.jpeg|\.png)$/i)) {
                    throw new Error('Product photo must be a valid .jpg, .jpeg, or .png file path');
                }
            }
        }
    },
    companyLogo: { 
        type: DataTypes.STRING,
        allowNull: true,  // Company logo may not be mandatory
        validate: {
            isFilePath(value) {
                if (value && !value.match(/(\.jpg|\.jpeg|\.png)$/i)) {
                    throw new Error('Company logo must be a valid .jpg, .jpeg, or .png file path');
                }
            }
        }
    },
    productCategory: {
        type: DataTypes.STRING,
        allowNull: false  
    },
    validity: {
        type: DataTypes.DATE,
        allowNull: false  
    },
    creator: {
        type: DataTypes.STRING,
        allowNull: false  
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false, 
        validate: {
            isFloat: true, 
            min: 0
        }
    },
    new_price: {
        type: DataTypes.FLOAT,
        allowNull: true,  // New price may not be mandatory
        validate: {
            isFloat: true,
            min: 0
        }
    },
    discount: {
        type: DataTypes.FLOAT,
        allowNull: true,  // Discounts are not mandatory
        validate: {
            isFloat: true,
            min: 0
        }
    },
    productInfo: {
        type: DataTypes.TEXT,
        allowNull: true  // Additional product information may not be mandatory
    },
    location: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: false  // Location must be specified
    },
    expiration: {
        type: DataTypes.DATE,
        allowNull: false  // Expiration date must be specified
    }
});

module.exports = Coupon;
