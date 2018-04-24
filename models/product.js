import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// Product Schema.
var ProductSchema = new Schema({
  "category": {
    type: String,
    index: true,
    trim: true
  },
  "count": {
    type: Number
  }
});

const Product = mongoose.model('Product', ProductSchema);

Product.saveProduct = function (product, callback) {
  let newProduct = new Product(product);
  newProduct.save(callback);
};

Product.getProductWithCategory = function(category, callback) {
  Product.findOne({category: category}, callback);
}

export default Product;