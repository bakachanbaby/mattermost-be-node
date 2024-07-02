const express = require('express');
const router = express.Router();
const {
    createRequest,
    getRequestById,
    getAllRequests,
    editRequest,
    deleteRequest,
    addCommentRequest,
    addAdviceRequest,
} = require('../controllers/request.controller');

router.post('/', createRequest);
router.get('/', getAllRequests);
router.get('/:id', getRequestById);
router.put('/:id', editRequest);
router.delete('/:id', deleteRequest);
router.put('/:id/comment', addCommentRequest);
router.put('/:id/advice', addAdviceRequest);


module.exports = router;