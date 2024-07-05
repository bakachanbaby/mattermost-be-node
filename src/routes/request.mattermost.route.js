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
    handleOpenConfirmDeleteRequest,
    handleConfirmDeleteRequest,
    handleSelectRequestToComment,
    handleOpenCommentRequest,
    handleCommentRequest,
    handleSendListRequest,
    handleCancelSendListRequest,
    handleConfirmSendListRequest,
    handleRequestToAdvice,
    handleOpenAdviceDialog,
    handleAdviceRequest,
    handleApproveRequest,
    handleSumaryRequest,
    handleViewTableApprovedRequest,
    handleViewTablePendingRequest,
    handleViewTableRejectedRequest,
    handleSendApproveLink,
    handleSendPendingLink,
    handleSendRejectedLink,
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
router.post('/open-confirm-delete-request/:id', handleOpenConfirmDeleteRequest);
router.post('/confirm-delete-request/:id', handleConfirmDeleteRequest);
router.post('/open-request-to-advice', handleRequestToAdvice);
router.post('/open-advice-dialog/:id', handleOpenAdviceDialog);
router.post('/open-advice-dialog', handleOpenAdviceDialog);
router.post('/advice-request/:id', handleAdviceRequest);
router.post('/select-request-to-comment', handleSelectRequestToComment);
router.post('/open-comment-request/:id', handleOpenCommentRequest);
router.post('/open-comment-request', handleOpenCommentRequest);
router.post('/comment-request/:id', handleCommentRequest);
router.post('/send-list-request', handleSendListRequest);
router.post('/cancel-send-list-request', handleCancelSendListRequest);
router.post('/confirm-send-list-request', handleConfirmSendListRequest);
router.post('/approve-request/:id', handleApproveRequest);
router.post('/sumary-requests', handleSumaryRequest);
router.post('/view-table-approved-request', handleViewTableApprovedRequest);
router.post('/view-table-pending-request', handleViewTablePendingRequest);
router.post('/view-table-rejected-request', handleViewTableRejectedRequest);
router.post('/send-approved-report-link', handleSendApproveLink);
router.post('/send-pending-report-link', handleSendPendingLink);
router.post('/send-rejected-report-link', handleSendRejectedLink);

module.exports = router;