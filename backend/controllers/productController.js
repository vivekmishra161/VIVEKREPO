const Product = require("../models/product");

exports.getAllProducts = async () => {
  return await Product.findAll({
    order: [["id", "DESC"]]
  });
};

exports.getProductByPartNo = async (part_no) => {
  return await Product.findOne({
    where: { part_no }
  });
};
