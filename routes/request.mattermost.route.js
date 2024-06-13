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
    handleSendListRequest,
} = require('../controllers/request.mattermost.controller');

router.post('/open-dialog-request', handleOpenDialogRequest);
router.post('/add-request', handleAddRequest);
router.post('/view-table-request', handleViewTableRequest);
router.post('/view-request', handleViewRequest);
router.post('/open-edit-request', handleOpenEditRequest);
router.post('/open-edit-request/:code', handleOpenEditRequest);
router.post('/edit-request/:id', handleEditRequest);
router.post('/delete-request', handleDeleteRequest);
router.post('/delete-request/:code', handleDeleteRequest);
router.post('/cancel-delete-request', handleCancelDeleteRequest);
router.post('/confirm-delete-request/:id', handleConfirmDeleteRequest);
router.post('/approve-request/:id', handleApproveRequest);
router.post('/open-comment-request/:id', handleOpenCommentRequest);
router.post('/comment-request/:id', handleCommentRequest);
router.post('/send-list-request', handleSendListRequest);

module.exports = router;