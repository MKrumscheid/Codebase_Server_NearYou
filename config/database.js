const { Sequelize } = require("sequelize");

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  sequelize = new Sequelize("postgres", "postgres", "123", {
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
}
