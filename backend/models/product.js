const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define("Product", {
  part_no: {
    type: DataTypes.STRING,
    unique: true
  },
  name: DataTypes.TEXT,
  category: DataTypes.STRING,
  price: DataTypes.FLOAT,
  discount: DataTypes.INTEGER,
  final_price: DataTypes.FLOAT,
  stock: DataTypes.STRING
});

module.exports = Product;
