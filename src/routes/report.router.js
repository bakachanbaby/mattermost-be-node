const express = require('express');
const router = express.Router();
const {
    handleExportExcel,
} = require('../controllers/report.controller');

router.get('/:id', handleExportExcel);
router.post('/:id', handleExportExcel);

module.exports = router;