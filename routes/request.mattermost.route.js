const express = require('express');
const router = express.Router();
const {
    handleAddRequest,
    handleOpenDialogRequest,
    handleViewTableRequest,
    handleViewRequest,
    handleOpenEditRequest,
    handleEditRequest,
    handleDeleteRequest,
    handleCancelDeleteRequest,
    handleConfirmDeleteRequest,
    handleApproveRequest,
    handleOpenCommentRequest,
    handleCommentRequest,
} = require('../controllers/request.mattermost.controller');

router.post('/open-dialog-request', handleOpenDialogRequest);
router.post('/add-request', handleAddRequest);
router.post('/view-table-request', handleViewTableRequest);
router.post('/view-request', handleViewRequest);
router.post('/open-edit-request', handleOpenEditRequest);
router.post('/edit-request/:id', handleEditRequest);
router.post('/delete-request', handleDeleteRequest);
router.post('/cancel-delete-request', handleCancelDeleteRequest);
router.post('/confirm-delete-request/:id', handleConfirmDeleteRequest);
router.post('/approve-request/:id', handleApproveRequest);
router.post('/open-comment-request/:id', handleOpenCommentRequest);
router.post('/comment-request/:id', handleCommentRequest);

module.exports = router;