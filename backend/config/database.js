const { Sequelize } = require("sequelize");

let sequelize = null;

if (process.env.DATABASE_URL) {
  console.log("✅ Using Render database");

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  console.log("⚠️ DATABASE_URL not set — skipping DB connection locally");
}

module.exports = sequelize;
