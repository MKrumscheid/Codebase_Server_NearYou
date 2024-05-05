const sequelize = require('../database'); // The Sequelize connection instance
const Coupon = require('./Coupon');
const Message = require('./Message');

// Check and sync all models
const setupDatabase = async () => {
    try {
        await sequelize.sync({ force: process.env.NODE_ENV === 'development' }); // Drops tables before syncing, beware of data loss!!!
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Unable to synchronize database:', error);
    }
}

module.exports = {
    Coupon,
    Message,
    setupDatabase
};
