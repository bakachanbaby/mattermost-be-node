const mongoose = require('mongoose');
const { REQUEST_STATUS } = require('../enums/define');
const { Schema } = mongoose;

const adviceSchema = new mongoose.Schema({
    username: { type: String},
    isAdvice: { type: Boolean, default: false}
});

const commentsSchema = new mongoose.Schema({
    content: { type: String},
    username: { type: String},
    createdDate: { type: String, default: new Date()}
});

const RequestSchema = new Schema({
    code: String,
    title: String,
    content: String,
    status: {
        type: String,
        default: REQUEST_STATUS.IDLE,
    },
    category: String,
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
    comments: [commentsSchema],
    advice: [adviceSchema]
});

const RequestModal = mongoose.model('Request', RequestSchema);

module.exports = RequestModal;