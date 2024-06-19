const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;