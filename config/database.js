const { Sequelize } = require("sequelize");

//setting up the connection to the database
const sequelize = new Sequelize("postgres", "postgres", "123", {
  //123 is not actually a secure password ;)
  host: "localhost",
  dialect: "postgres",
  pool: {
    max: 50, // Maximum number of connections in the pool
    min: 0,
    acquire: 30000, // Maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 50000, // Maximum time, in milliseconds, that a connection can be idle before being released
  },
});

module.exports = sequelize;
