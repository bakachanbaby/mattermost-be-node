const express = require('express');
const router = express.Router();
const {
    handleAddRequest,
    handleOpenDialogRequest,
    handleViewTableRequest,
    handleViewRequest,
    handleRequestToEdit,
    handleOpenEditRequest,
    handleEditRequest,
    handleOpenDeleteRequest,
    handleDeleteRequest,
    handleCancelDeleteRequest,
    handleConfirmDeleteRequest,
    handleOpenCommentRequest,
    handleCommentRequest,
    handleSendListRequest,
    handleRequestToAdvice,
    handleOpenAdviceDialog,
    handleAdviceRequest,
    handleApproveRequest,
} = require('../controllers/request.mattermost.controller');

router.post('/open-dialog-request', handleOpenDialogRequest);
router.post('/add-request', handleAddRequest);
router.post('/view-table-request', handleViewTableRequest);
router.post('/view-request', handleViewRequest);
router.post('/open-edit-request', handleOpenEditRequest);
router.post('/open-request-to-edit', handleRequestToEdit);
router.post('/open-edit-request/:code', handleOpenEditRequest);
router.post('/edit-request/:id', handleEditRequest);
router.post('/open-delete-request', handleOpenDeleteRequest);
router.post('/delete-request', handleDeleteRequest);
router.post('/delete-request/:code', handleDeleteRequest);
router.post('/cancel-delete-request', handleCancelDeleteRequest);
router.post('/confirm-delete-request/:id', handleConfirmDeleteRequest);
router.post('/open-request-to-advice', handleRequestToAdvice);
router.post('/open-advice-dialog/:id', handleOpenAdviceDialog);
router.post('/open-advice-dialog', handleOpenAdviceDialog);
router.post('/advice-request/:id', handleAdviceRequest);
router.post('/open-comment-request/:id', handleOpenCommentRequest);
router.post('/comment-request/:id', handleCommentRequest);
router.post('/send-list-request', handleSendListRequest);
router.post('/approve-request/:id', handleApproveRequest);

module.exports = router;