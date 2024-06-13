const express = require('express');
const router = express.Router();
const {
    createCategory,
    getCategory,
    getAllCategories,
    editCategory,
    deleteCategory,
} = require('../controllers/category.controller');

router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/:id', getCategory);
router.put('/:id', editCategory);
router.delete('/:id', deleteCategory);

module.exports = router;