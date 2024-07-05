const express = require('express');
const router = express.Router();
const {
    handleExportExcel,
} = require('../controllers/report.controller');

router.get('/', handleExportExcel);
router.post('/', handleExportExcel);

module.exports = router;