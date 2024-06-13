const mongoose = require('mongoose');
const { Schema } = mongoose;

const RequestSchema = new Schema({
    code: String,
    title: String,
    content: String,
    status: {
        type: String,
        default: "Đã tạo",
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