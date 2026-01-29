const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define(
  "Product",
  {
    part_no: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    manufacturer: {          // ✅ THIS WAS MISSING
     type: DataTypes.STRING
  },
    category: DataTypes.STRING,
    price: DataTypes.FLOAT,
    discount: DataTypes.INTEGER,
    final_price: DataTypes.FLOAT,
    stock: DataTypes.STRING
  },
  {
    tableName: "products",
    timestamps: false
  }
);

module.exports = Product;
