const Category = require('../models/category.modal');

// Import the necessary modules and models

// Create a new category
const createCategory = async (req, res) => {
  try {
    const {
      description
    } = req.body;
    const category = new Category({
      description
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create category'
    });
  }
};

// Get a category by ID
const getCategory = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get category'
    });
  }
};

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get categories'
    });
  }
};

// Edit a category by ID
const editCategory = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      name,
      description
    } = req.body;
    const category = await Category.findByIdAndUpdate(id, {
      name,
      description
    }, {
      new: true
    });
    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to edit category'
    });
  }
};

// Delete a category by ID
const deleteCategory = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }
    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete category'
    });
  }
};

// Export the controller functions
module.exports = {
  createCategory,
  getCategory,
  getAllCategories,
  editCategory,
  deleteCategory
};