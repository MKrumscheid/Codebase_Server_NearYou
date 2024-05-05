const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('./database'); // import your database connection

const Message = sequelize.define('Message', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: false
    },
    expiration: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = Message;
