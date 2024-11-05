const express = require('express');
const router = express.Router();
const {
    createCategory,
    getCategory,
    getAllCategories,
    editCategory,
    deleteCategory,
    createZaloRequest,
} = require('../controllers/category.controller');

router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/:id', getCategory);
router.put('/:id', editCategory);
router.delete('/:id', deleteCategory);
router.get('/zalo/request', createZaloRequest);
module.exports = router;