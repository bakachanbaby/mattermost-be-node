const mongoose = require('mongoose');
const { REQUEST_STATUS } = require('../enums/define');
const { Schema } = mongoose;

const RequestSchema = new Schema({
    code: String,
    title: String,
    content: String,
    status: {
        type: REQUEST_STATUS,
        default: REQUEST_STATUS.IDLE,
    },
    category: Object,
    result: {
        type: String,
        default: "Đang chờ xử lý",
    },
    createdDate: {
        type: String,
        default: new Date(),
    },
    receivedDate: {
        type: String,
        default: new Date(),
    },
    comments: {
        content: String,
        createdDate: {
            type: String,
            default: new Date(),
        },
    },
});

const RequestModal = mongoose.model('Request', RequestSchema);

module.exports = RequestModal;