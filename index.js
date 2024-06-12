// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('./models/user.model.js');
// const imageDownloader = require('image-downloader');
// const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// const multer = require('multer');
// const fs = require('fs');
// const mime = require('mime-types');
const userRoute = require("./routes/user.router.js");
const categoryRoute = require("./routes/category.route.js");
const requestRoute = require("./routes/request.router");
const requestMattermostRoute = require("./routes/request.mattermost.route");
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const axios = require('axios');
const bodyParser = require('body-parser');
const Category = require("./models/category.modal.js");

require('dotenv').config();

const app = express();
// const bcryptSalt = bcrypt.genSaltSync(10);
// const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';
// const bucket = 'dawid-booking-app';

const DIALOG_URL = `${process.env.URL_MATTERMOST}/api/v4/actions/dialogs/open`;
const MESSAGE_URL = `${process.env.URL_MATTERMOST}/api/v4/posts`;
const MATTERMOST_ACCESS = process.env.MATTERMOST_ACCESS_TOKEN;
const NGROK_URL = process.env.URL_NGROK;
const POST_URL = `${process.env.URL_MATTERMOST}/api/v4/posts`;

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000',
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use("/api/users", userRoute);
app.use("/api/category", categoryRoute);
app.use("/api/request", requestRoute);
app.use("/api/request-mattermost", requestMattermostRoute);

app.get("/", (req, res) => {
    res.send("Hello from Node API Server Updated");
});
// Endpoint để xử lý Autocomplete
app.post('/autocomplete', async (req, res) => {
    const { command, query } = req.body;

    // Kiểm tra command và trả về gợi ý Autocomplete dựa trên query
    if (command === '/view-kn') {
        // Ví dụ trả về các ID kiến nghị tĩnh, bạn có thể thay đổi thành động
        const suggestions = [
            { text: '1', value: '1' },
            { text: '2', value: '2' },
            { text: '3', value: '3' }
        ];

        res.json({ items: suggestions });
    } else {
        res.json({ items: [] });
    }
});

app.post('/interactive-message', (req, res) => {
    const response_url = req.body.response_url;
    const trigger_id = req.body.trigger_id;
    const channel_id = req.body.channel_id;

    const messageData = {
        channel_id: channel_id,
        message: "Đã có kiến nghị mới cần phê duyệt.",
        props: {
            attachments: [
                {
                    text: "Thông tin kiến nghị",
                    fields: [
                        { title: "STT", value: "2", short: true },
                        { title: "Tiêu đề", value: "test edit phat ne", short: true },
                        { title: "Nội dung", value: "test nội dung 3", short: true },
                        { title: "Ngày tạo", value: "03/05/2024", short: true },
                        { title: "Lĩnh vực", value: "Tao thu mot danh muc xem the nao", short: true },
                        { title: "Trạng thái", value: "Đã xong", short: true },
                    ],
                    actions: [
                        {
                            name: "Hủy bỏ",
                            integration: {
                                url: `${NGROK_URL}/cancel`,
                                context: {
                                    action: "delete_message",
                                    value: "cancel"
                                }
                            }
                        },
                        {
                            name: "Phê duyệt",
                            integration: {
                                url: `${NGROK_URL}/approve`,
                                context: {
                                    action: "display_notification",
                                    value: "approve"
                                }
                            }
                        }
                    ]
                }
            ]
        }
    };

    try {
        const response = axios.post(`${MESSAGE_URL}`, messageData, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Message sent:', response.data);
    } catch (error) {
        console.error('Error sending message:', error);
    }
});

app.post('/cancel', async (req, res) => {
    const { post_id, user_name } = req.body;
    console.log(req.body);
    try {
        await axios.delete(`${POST_URL}/${post_id}`, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`
            }
        });

        const cancelMessage = {
            channel_id: req.body.channel_id,
            message: `${user_name} Đã hủy phê duyệt.`,
        };

        await axios.post(MESSAGE_URL, cancelMessage, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).send('Cancellation message sent');
    } catch (error) {
        console.error('Error handling cancellation:', error);
        res.status(500).send('Error handling cancellation');
    }
});

app.post('/approve', async (req, res) => {
    const { post_id, user_name } = req.body;

    try {
        await axios.delete(`${POST_URL}/${post_id}`, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`
            }
        });

        const approveMessage = {
            channel_id: req.body.channel_id,
            message: `${user_name} Đã phê duyệt kiến nghị thành công.`,
        };

        await axios.post(MESSAGE_URL, approveMessage, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).send('Approval message sent');
    } catch (error) {
        console.error('Error handling approval:', error);
        res.status(500).send('Error handling approval');
    }
});

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to database!");
        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch(() => {
        console.log("Connection failed!");
    });


