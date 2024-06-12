const express = require('express');
const router = express.Router();
const {
    createRequest,
    getRequestById,
    getAllRequests,
    editRequest,
    deleteRequest,
} = require('../controllers/request.controller');

router.post('/', createRequest);
router.get('/', getAllRequests);
router.get('/:id', getRequestById);
router.put('/:id', editRequest);
router.delete('/:id', deleteRequest);


module.exports = router;