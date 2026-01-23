const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define("Order", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  customerName: DataTypes.STRING,
  address: DataTypes.STRING,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  phone: DataTypes.STRING,
  pin: DataTypes.STRING,

  totalPrice: DataTypes.FLOAT,

  paymentMethod: DataTypes.STRING,
  paymentStatus: DataTypes.STRING,
  status: DataTypes.STRING,

  utrNumber: {
    type: DataTypes.STRING,
    allowNull: true   // ✅ VERY IMPORTANT
  },

  items: {
    type: DataTypes.JSON,
    allowNull: false
  }

});

module.exports = Order;
