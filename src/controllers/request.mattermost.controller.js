
require('dotenv').config();

const axios = require('axios');
const CategoryModal = require('../models/category.modal');
const UserModel = require('../models/user.model');
const RequestModal = require('../models/request.model');
const { REQUEST_STATUS } = require('../enums/define');
const { DIALOG_URL, MESSAGE_URL, MATTERMOST_ACCESS, NGROK_URL, POST_URL, USER_URL, DIRECT_URL, TEAM_URL, MATTERMOST_ACCESS_BOT_TP, BOTS_URL, CHANNEL_ID1, CHANNEL_ID2 } = require('../enums/config');
const BotModel = require('../models/bot.model');

const getStatus = (status) => {
    switch (status) {
        case REQUEST_STATUS.IDLE:
            return 'Vừa khởi tạo';
        case REQUEST_STATUS.SENT:
            return 'Đã gửi kiến nghị';
        case REQUEST_STATUS.PENDING:
            return 'Đang chờ xử lý';
        case REQUEST_STATUS.WAITING:
            return 'Đang chờ ý kiến';
        case REQUEST_STATUS.APPROVED:
            return 'Đã chấp nhận';
        case REQUEST_STATUS.REJECTED:
            return 'Đã từ chối';
        default:
            return '';

    }
}

const compareDate = (day, month, year) => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const dayInt = parseInt(day);
    const monthInt = parseInt(month);
    const yearInt = parseInt(year);

    console.log(currentDay, currentMonth, currentYear);


    if (yearInt > currentYear) {
        return false;
    }

    if (yearInt === currentYear) {
        if (monthInt > currentMonth) {
            return false;
        }

        if (monthInt === currentMonth) {
            if (dayInt > currentDay) {
                return false;
            }
        }
    }

    return true;
}

const replaceText = (text) => {
    // Kiểu tra nếu text có \n, | thì thay thế bằng dấu cách
    let newText = text.replace(/\n/g, ' ');
    newText = newText.replace(/\|/g, '-');
    return newText;
}

const optionDay = [
    { text: "1", value: "1" },
    { text: "2", value: "2" },
    { text: "3", value: "3" },
    { text: "4", value: "4" },
    { text: "5", value: "5" },
    { text: "6", value: "6" },
    { text: "7", value: "7" },
    { text: "8", value: "8" },
    { text: "9", value: "9" },
    { text: "10", value: "10" },
    { text: "11", value: "11" },
    { text: "12", value: "12" },
    { text: "13", value: "13" },
    { text: "14", value: "14" },
    { text: "15", value: "15" },
    { text: "16", value: "16" },
    { text: "17", value: "17" },
    { text: "18", value: "18" },
    { text: "19", value: "19" },
    { text: "20", value: "20" },
    { text: "21", value: "21" },
    { text: "22", value: "22" },
    { text: "23", value: "23" },
    { text: "24", value: "24" },
    { text: "25", value: "25" },
    { text: "26", value: "26" },
    { text: "27", value: "27" },
    { text: "28", value: "28" },
    { text: "29", value: "29" },
    { text: "30", value: "30" },
    { text: "31", value: "31" }
];

const optionMonth = [
    { text: "1", value: "1" },
    { text: "2", value: "2" },
    { text: "3", value: "3" },
    { text: "4", value: "4" },
    { text: "5", value: "5" },
    { text: "6", value: "6" },
    { text: "7", value: "7" },
    { text: "8", value: "8" },
    { text: "9", value: "9" },
    { text: "10", value: "10" },
    { text: "11", value: "11" },
    { text: "12", value: "12" }
];

const optionYear = [
    { text: "2018", value: "2018" },
    { text: "2019", value: "2019" },
    { text: "2020", value: "2020" },
    { text: "2021", value: "2021" },
    { text: "2022", value: "2022" },
    { text: "2023", value: "2023" },
    { text: "2024", value: "2024" },

];

const handleOpenDialogRequest = async (req, res) => {
    try {
        const response_url = req.body.response_url;
        const trigger_id = req.body.trigger_id;
        const channel_id = req.body.channel_id;
        let post_id = req.body.post_id || '';

        console.log('Handle open dialog request', req.body);

        // const post_id = req.body.post_id;
        const lstBot = await BotModel.find();

        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        console.log('Access:', access);

        if (access === MATTERMOST_ACCESS_BOT_TP) {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền thêm kiến nghị mới`,
            }

            try {
                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });
                return res.status(200).send();
            } catch (error) {
                console.error('Error sending message:', error);
                return res.status(500).send();
            }

        }

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log('Handle open dialog request', req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền thêm kiến nghị mới`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            return res.status(200).send();
        }

        if (user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền thêm kiến nghị mới`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            return res.status(200).send();
        }

        // let lstCategory = await CategoryModal.find();
        // lstCategory = lstCategory.map((item) => {
        //     return {
        //         text: item.description,
        //         value: item._id
        //     };
        // });
        // console.log(req.body);
        // console.log(lstCategory);

        console.log(response_url, trigger_id, channel_id);
        const dialog = {
            trigger_id: trigger_id,
            url: `${NGROK_URL}/api/request-mattermost/add-request`,
            dialog: {
                callback_id: 'somecallbackid',
                title: 'Thêm kiến nghị mới',
                "elements": [
                    {
                        "display_name": "Tiêu đề",
                        "name": "title",
                        "type": "text",
                        "subtype": "",
                        "default": "",
                        "placeholder": "Vui lòng nhập tiêu đề",
                        "help_text": "",
                        "optional": false,
                        "requiredText": "Vui lòng nhập tiêu đề"
                    },
                    {
                        "display_name": "Nội dung",
                        "name": "content",
                        "type": "textarea",
                        "subtype": "",
                        "default": "",
                        "placeholder": "Vui lòng nhập nội dung",
                        "help_text": "",
                        "optional": false,
                        "max_length": 50000,
                    },
                    {
                        "display_name": "Ngày nhận kiến nghị",
                        "name": "receivedDay",
                        "type": "select",
                        "placeholder": "Vui lòng chọn ngày nhận kiến nghị",
                        "options": optionDay
                    },
                    {
                        "display_name": "Tháng nhận kiến nghị",
                        "name": "receivedMonth",
                        "type": "select",
                        "placeholder": "Vui lòng chọn tháng nhận kiến nghị",
                        "options": optionMonth
                    },
                    {
                        "display_name": "Năm nhận kiến nghị",
                        "name": "receivedYear",
                        "type": "select",
                        "placeholder": "Vui lòng chọn năm nhận kiến nghị",
                        "options": optionYear
                    },
                    {
                        "display_name": "Danh mục",
                        "name": "category",
                        "type": "text",
                        "subtype": "",
                        "default": "",
                        "placeholder": "Vui lòng nhập danh mục",
                        "help_text": "",
                        "optional": false,
                        "requiredText": "Vui lòng nhập danh mục"
                    },
                ],
                notify_on_cancel: true,
                state: JSON.stringify({ response_url, channel_id, trigger_id, post_id })
            }
        };

        console.log(dialog);

        await axios.post(DIALOG_URL, dialog, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        })
        res.status(200).send();
    } catch (error) {
        console.error('Error handling open dialog request:', error);
        return res.status(500).send('Internal Server Error');
    }

};

const handleAddRequest = async (req, res) => {
    try {
        const state = JSON.parse(req.body.state);
        const channel_id = state.channel_id;
        const post_id = state.post_id;
        const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
        console.log(state);
        console.log(req.body);

        if (!compareDate(req.body.submission.receivedDay, req.body.submission.receivedMonth, req.body.submission.receivedYear)) {
            const messageData = {
                channel_id: channel_id,
                message: `Ngày nhận kiến nghị không được xa hơn ngày hiện tại`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            return res.status(200).send();
        }

        if (!req.body.submission.title || !req.body.submission.content || !req.body.submission.receivedDay || !req.body.submission.receivedMonth || !req.body.submission.receivedYear || !req.body.submission.category) {
            return res.status(200).send();
        }

        try {
            const reqRequest = {
                title: req.body.submission.title,
                content: replaceText(req.body.submission.content),
                receivedDate: (`${req.body.submission.receivedDay}/${req.body.submission.receivedMonth}/${req.body.submission.receivedYear}`),
                category: req.body.submission.category,
            }

            console.log(reqRequest);

            if (!reqRequest.title || !reqRequest.content || !reqRequest.receivedDate || !reqRequest.category) {
                return res.status(200).send();
            }

            await axios.post(urlAddRequest, reqRequest)
                .then(async (e) => {
                    console.log('Add request', e.data);

                    // Lấy ra người dùng có id là user_id
                    const user = await UserModel.findOne({ userId: req.body.user_id });

                    if (!user) {
                        return res.status(404).send('User not found');
                    }

                    let lstRequest = await RequestModal.find();
                    lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);

                    console.log(lstRequest);

                    if (post_id) {
                        await axios.delete(`${POST_URL}/${post_id}`, {
                            headers: {
                                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                            }
                        });
                    }
                    // Hiển thị danh sách kiến nghị mới
                    try {
                        const tableTitle = "## Danh sách kiến nghị";
                        const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

                        const tableRows = lstRequest.map((request, index) => {
                            const date = new Date(request.createdDate);
                            const receivedDate = new Date(request.receivedDate);
                            const formattedDate = date.toLocaleDateString('vi-VN');
                            const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');

                            const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';

                            return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
                        });
                        const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                        const messageData = {
                            channel_id: channel_id,
                            message: `Người dùng **${req.body.user_name || user.username}** đã thêm kiến nghị mới với mã **${e.data.code}**`,
                            props: {
                                attachments: [
                                    {
                                        text: table,
                                        actions: [
                                            {
                                                name: "Thêm kiến nghị mới",
                                                type: "button",
                                                integration: {
                                                    url: `${NGROK_URL}/api/request-mattermost/open-dialog-request`,
                                                    context: {
                                                        action: "view"
                                                    }
                                                },
                                                style: "primary"
                                            },
                                            {
                                                name: "Sửa kiến nghị",
                                                type: "button",
                                                integration: {
                                                    url: `${NGROK_URL}/api/request-mattermost/open-request-to-edit`,
                                                    context: {
                                                        action: "edit"
                                                    }
                                                },
                                                style: "primary"
                                            },
                                            {
                                                name: "Loại bỏ kiến nghị",
                                                type: "button",
                                                integration: {
                                                    url: `${NGROK_URL}/api/request-mattermost/open-delete-request`,
                                                    context: {
                                                        action: "delete"
                                                    }
                                                },
                                                style: "primary",
                                            },
                                            {
                                                name: "Gửi danh sách kiến nghị",
                                                type: "button",
                                                integration: {
                                                    url: `${NGROK_URL}/api/request-mattermost/send-list-request`,
                                                    context: {
                                                        action: "send"
                                                    }
                                                },
                                                style: "primary"
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                        const response = await axios.post(MESSAGE_URL, messageData, {
                            headers: {
                                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                            }
                        });
                        console.log('Message sent:', response.data);
                        res.status(200).send();
                    } catch (error) {
                        console.error('Error sending message:', error);
                        res.status(500).send();
                    }

                })
                .catch(err => {
                    console.error(err);
                });

        }
        catch (error) {
            console.error('Error handling cancellation:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling add request:', error);
        return res.status(500).send();
    }
}

const handleViewTableRequest = async (req, res) => {
    try {
        const { channel_id } = req.body;
        const lstBot = await BotModel.find();

        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        console.log(lstBot);
        console.log(req.body);

        if (lstBot[0].channelIds[0] === channel_id) {
            let lstRequest = await RequestModal.find();
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);
            console.log(lstRequest);

            if (lstRequest.length === 0) {
                try {
                    const messageData = {
                        channel_id: channel_id,
                        message: `Không có kiến nghị nào mới được thêm`,
                        props: {
                            attachments: [
                                {
                                    text: "## Vui lòng thêm kiến nghị mới",
                                    actions: [
                                        {
                                            name: "Thêm kiến nghị mới",
                                            type: "button",
                                            integration: {
                                                url: `${NGROK_URL}/api/request-mattermost/open-dialog-request`,
                                                context: {
                                                    action: "view"
                                                }
                                            },
                                            style: "primary"
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    await axios.post(MESSAGE_URL, messageData, {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        }
                    });

                    res.status(200).send();
                } catch (error) {
                    console.error('Error sending message:', error);
                    res.status(500).send();
                }
            }

            else {
                const tableTitle = "## Danh sách kiến nghị\n";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |\n`;

                const tableRows = lstRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const receivedDate = new Date(request.receivedDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                    const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';


                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
                });
                const table = tableTitle + tableHeader + tableRows.join('\n');

                console.log(table);

                const data = `| Left-Aligned  | Center Aligned  | Right Aligned |
| :------------ |:---------------:| -----:|
| Left column 1 | this text       |  $100 |
| Left column 2 | is              |   $10 |
| Left column 3 | centered        |    $1 |`

                const messageData = {
                    channel_id: channel_id,
                    message: "Dưới đây là bảng thông tin kiến nghị:",
                    props: {
                        attachments: [
                            {
                                text: table,
                                actions: [
                                    {
                                        name: "Thêm kiến nghị mới",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-dialog-request`,
                                            context: {
                                                action: "view"
                                            }
                                        },
                                        style: "primary"
                                    },
                                    {
                                        name: "Sửa kiến nghị",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-request-to-edit`,
                                            context: {
                                                action: "edit"
                                            }
                                        },
                                        style: "primary"
                                    },
                                    {
                                        name: "Loại bỏ kiến nghị",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-delete-request`,
                                            context: {
                                                action: "delete"
                                            }
                                        },
                                        style: "primary",
                                    },
                                    {
                                        name: "Gửi danh sách kiến nghị",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/send-list-request`,
                                            context: {
                                                action: "send"
                                            }
                                        },
                                        style: "primary"
                                    }
                                ]
                            }
                        ]
                    }
                };

                try {
                    const response = await axios.post(MESSAGE_URL, messageData, {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        }
                    });
                    console.log('Message sent:', response.data);
                    res.status(200).send();
                } catch (error) {
                    console.error('Error sending message:', error);
                    res.status(500).send();
                }
            }
        }

        else if (lstBot[1].channelIds[0] === channel_id) {
            let lstRequest = await RequestModal.find();
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.SENT);
            console.log(lstRequest);

            if (lstRequest.length === 0) {
                try {
                    const messageData = {
                        channel_id: channel_id,
                        message: `Không có kiến nghị nào mới được thêm`,
                    };

                    await axios.post(MESSAGE_URL, messageData, {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    res.status(200).send();
                } catch (error) {
                    console.error('Error sending message:', error);
                    res.status(500).send();
                }
            }

            else {
                const tableTitle = "## Danh sách kiến nghị";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

                const tableRows = lstRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const receivedDate = new Date(request.receivedDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                    const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';


                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
                });
                const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                const messageData = {
                    channel_id: channel_id,
                    message: "Dưới đây là bảng thông tin kiến nghị:",
                    props: {
                        attachments: [
                            {
                                text: table,
                                actions: [
                                    {
                                        name: "Sửa kiến nghị",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-request-to-edit`,
                                            context: {
                                                action: "edit"
                                            }
                                        },
                                        style: "primary"
                                    },
                                    {
                                        name: "Loại bỏ kiến nghị",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-delete-request`,
                                            context: {
                                                action: "delete"
                                            }
                                        },
                                        style: "primary",
                                    },
                                    {
                                        name: "Gửi danh sách kiến nghị",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/send-list-request`,
                                            context: {
                                                action: "send"
                                            }
                                        },
                                        style: "primary"
                                    }
                                ]
                            }
                        ]
                    }
                };

                try {
                    const response = await axios.post(MESSAGE_URL, messageData, {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('Message sent:', response.data);
                    res.status(200).send();
                } catch (error) {
                    console.error('Error sending message:', error);
                    res.status(500).send();
                }
            }
        }

        else if (lstBot[1].botChannelId === channel_id) {
            let lstRequest = await RequestModal.find();
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.PENDING);
            console.log(lstRequest);

            if (lstRequest.length === 0) {
                try {
                    const messageData = {
                        channel_id: channel_id,
                        message: `Không có kiến nghị nào mới được thêm`,
                    };

                    await axios.post(MESSAGE_URL, messageData, {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    res.status(200).send();
                } catch (error) {
                    console.error('Error sending message:', error);
                    res.status(500).send();
                }
            }

            else {
                const tableTitle = "## Danh sách kiến nghị";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận|\n| --- | --- | --- | --- | --- | --- |`;

                const tableRows = lstRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const receivedDate = new Date(request.receivedDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');

                    const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';

                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
                });
                const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                const messageData = {
                    channel_id: channel_id,
                    message: "Dưới đây là bảng thông tin kiến nghị:",
                    props: {
                        attachments: [
                            {
                                text: table,
                                actions: [
                                    {
                                        name: 'Xin ý kiến',
                                        type: 'button',
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-request-to-advice`,
                                            context: {
                                                action: 'advice'
                                            }
                                        },
                                        style: 'primary'
                                    },
                                    {
                                        name: 'Bình luận kiến nghị',
                                        type: 'button',
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/select-request-to-comment`,
                                            context: {
                                                action: 'comment'
                                            }
                                        },
                                        style: 'primary'
                                    }
                                ]
                            }
                        ]
                    }
                };

                try {
                    const response = await axios.post(MESSAGE_URL, messageData, {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('Message sent:', response.data);
                    res.status(200).send();
                } catch (error) {
                    console.error('Error sending message:', error);
                    res.status(500).send();
                }
            }
        }

        else {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng không có quyền xem danh sách kiến nghị`,
            }

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json',
                }
            });


        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling view table request:', error);
        return res.status(500).send();
    }

};

const handleViewRequest = async (req, res) => {
    try {
        const { channel_id, text } = req.body;
        console.log('Handle view request', req.body);

        const lstBot = await BotModel.find();

        if (lstBot[0].channelIds[0] === channel_id) {
            // Lấy ra kiến nghị có code là text
            const request = await RequestModal.findOne({ code: text });
            console.log(request);

            if (!request) {

                let messageData = {};

                text ?
                    messageData = {
                        channel_id: channel_id,
                        message: `Không tìm thấy kiến nghị với mã **${text}**`,
                    } :
                    messageData = {
                        channel_id: channel_id,
                        message: `Không tìm thấy kiến nghị, vui lòng nhập mã kiến nghị`,
                    }

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                return res.status(200).send();
            }

            if (request.status !== REQUEST_STATUS.IDLE) {
                const messageData = {
                    channel_id: channel_id,
                    message: `Kiến nghị mã **${request.code}** không có trong danh sách, không thể xem`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                return res.status(200).send();
            }

            const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

            const fields = [
                { title: "Mã kiến nghị", value: text, short: true },
                { title: "Tiêu đề", value: request.title, short: true },
                { title: "Ngày tạo", value: formattedDate, short: true },
                { title: "Ngày nhận", value: request.receivedDate, short: true },
                { title: "Danh mục", value: request.category, short: true },
                { title: "Trạng thái", value: getStatus(request.status), short: true },
                { title: "Nội dung", value: request.content, short: false },
            ]

            let commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('.\n') : 'Chưa có bình luận';

            if (request.comments && request.comments.length > 0) {
                fields.push({ title: "Bình luận", value: commentContent, short: false });
            }

            const messageData = {
                channel_id: channel_id,
                message: "Dưới đây là thông tin kiến nghị:",
                props: {
                    attachments: [
                        {
                            text: "## Thông tin kiến nghị",
                            fields: fields,
                            actions: [
                                {
                                    name: "Sửa kiến nghị",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/open-edit-request/${request.code}`,
                                        context: {
                                            action: "edit"
                                        }
                                    },
                                    style: "primary"
                                },
                                {
                                    name: "Loại bỏ kiến nghị",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/delete-request/${request.code}`,
                                        context: {
                                            action: "delete"
                                        }
                                    },
                                    style: "danger"
                                }
                            ]
                        }
                    ]
                }
            };

            try {
                const response = await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });
                console.log('Message sent:', response.data);
                res.status(200).send();
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }
        }

        else if (lstBot[1].channelIds[0] === channel_id) {
            // Lấy ra kiến nghị có code là text
            const request = await RequestModal.findOne({ code: text });
            console.log(request);

            if (!request) {
                let messageData = {};

                text ?
                    messageData = {
                        channel_id: channel_id,
                        message: `Không tìm thấy kiến nghị với mã **${text}**`,
                    } :
                    messageData = {
                        channel_id: channel_id,
                        message: `Không tìm thấy kiến nghị, vui lòng nhập mã kiến nghị`,
                    }

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();
            }

            if (request.status !== REQUEST_STATUS.SENT) {
                const messageData = {
                    channel_id: channel_id,
                    message: `Kiến nghị mã **${request.code}** không có trong danh sách, không thể xem`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();
            }

            const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

            const fields = [
                { title: "Mã kiến nghị", value: text, short: true },
                { title: "Tiêu đề", value: request.title, short: true },
                { title: "Ngày tạo", value: formattedDate, short: true },
                { title: "Ngày nhận", value: request.receivedDate, short: true },
                { title: "Danh mục", value: request.category, short: true },
                { title: "Trạng thái", value: getStatus(request.status), short: true },
                { title: "Nội dung", value: request.content, short: false },
            ]

            let commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('.\n') : 'Chưa có bình luận';

            if (request.comments && request.comments.length > 0) {
                fields.push({ title: "Bình luận", value: commentContent, short: false });
            }

            const messageData = {
                channel_id: channel_id,
                message: "Dưới đây là thông tin kiến nghị:",
                props: {
                    attachments: [
                        {
                            text: "## Thông tin kiến nghị",
                            fields: fields,
                            actions: [
                                {
                                    name: "Sửa kiến nghị",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/open-edit-request/${request.code}`,
                                        context: {
                                            action: "edit"
                                        }
                                    },
                                    style: "primary"
                                },
                                {
                                    name: "Loại bỏ kiến nghị",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/delete-request/${request.code}`,
                                        context: {
                                            action: "delete"
                                        }
                                    },
                                    style: "danger"
                                }
                            ]
                        }
                    ]
                }
            };

            try {
                const response = await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Message sent:', response.data);
                res.status(200).send();
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }
        }

        else if (lstBot[1].botChannelId === channel_id) {
            // Lấy ra kiến nghị có code là text
            const request = await RequestModal.findOne({ code: text });
            console.log('Request View ', request);

            if (!request) {
                let messageData = {};

                text ?
                    messageData = {
                        channel_id: channel_id,
                        message: `Không tìm thấy kiến nghị với mã **${text}**`,
                    } :
                    messageData = {
                        channel_id: channel_id,
                        message: `Không tìm thấy kiến nghị, vui lòng nhập mã kiến nghị`,
                    }

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();
            }

            if (request.status !== REQUEST_STATUS.PENDING) {
                const messageData = {
                    channel_id: channel_id,
                    message: `Kiến nghị mã **${request.code}** không có trong danh sách, không thể xem`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();
            }

            const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

            const fields = [
                { title: "Mã kiến nghị", value: text, short: true },
                { title: "Tiêu đề", value: request.title, short: true },
                { title: "Ngày tạo", value: formattedDate, short: true },
                { title: "Ngày nhận", value: request.receivedDate, short: true },
                { title: "Danh mục", value: request.category, short: true },
                { title: "Trạng thái", value: getStatus(request.status), short: true },
                { title: "Nội dung", value: request.content, short: false },
            ]

            const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('.\n') : 'Chưa có bình luận';

            if (request.comments && request.comments.length > 0) {
                fields.push({ title: "Bình luận", value: commentContent, short: false });
            }

            const messageData = {
                channel_id: channel_id,
                message: "Dưới đây là thông tin kiến nghị:",
                props: {
                    attachments: [
                        {
                            text: "## Thông tin kiến nghị",
                            fields: fields,
                            actions: [
                                {
                                    name: 'Xin ý kiến',
                                    type: 'button',
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/open-advice-dialog/${request._id}`,
                                        context: {
                                            action: 'advice'
                                        }
                                    },
                                    style: 'primary'
                                },
                                {
                                    name: 'Bình luận kiến nghị',
                                    type: 'button',
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/select-request-to-comment`,
                                        context: {
                                            action: 'comment'
                                        }
                                    },
                                    style: 'primary'
                                }

                            ]
                        }
                    ]
                }
            };

            try {
                const response = await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Message sent:', response.data);
                res.status(200).send();
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }
        }

        else {

            let messageData = {};

            text ?
                messageData = {
                    channel_id: channel_id,
                    message: `Không tìm thấy kiến nghị với mã **${text}**`,
                } :
                messageData = {
                    channel_id: channel_id,
                    message: `Không tìm thấy kiến nghị, vui lòng nhập mã kiến nghị`,
                }

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        return res.status(200).send();

    } catch (error) {
        console.error('Error handling view request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleSendListRequest = async (req, res) => {
    try {
        const { channel_id } = req.body;
        let post_id = req.body.post_id || '';
        console.log(req.body);

        let text = '';

        if (req.body.text) {
            text = req.body.text;
        }
        else if (req.params.code) {
            text = req.params.code;
        }
        else if (req.body.context?.selected_option) {
            text = req.body.context.selected_option;
        }

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;


        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền loại bỏ kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        // Kiểm tra xem người dùng có quyền sửa kiến nghị không
        if (user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền loại bỏ kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        let lstRequest = await RequestModal.find();

        if (access === MATTERMOST_ACCESS_BOT_TP) {
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.SENT);
        }
        else if (access === MATTERMOST_ACCESS) {
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);
        }


        if (lstRequest.length === 0) {
            const messageData = {
                channel_id: channel_id,
                message: `Không có kiến nghị nào mới được thêm`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }





        // if (post_id) {
        //     await axios.delete(`${POST_URL}/${post_id}`, {
        //         headers: {
        //             'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
        //             'Content-Type': 'application/json',
        //             'X-Requested-With': 'XMLHttpRequest',
        //         }
        //     });
        // }

        try {

            const tableTitle = "## Danh sách kiến nghị\n";
            const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |\n`;

            const tableRows = lstRequest.map((request, index) => {
                const date = new Date(request.createdDate);
                const receivedDate = new Date(request.receivedDate);
                const formattedDate = date.toLocaleDateString('vi-VN');
                const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
                return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
            });

            const table = tableTitle + tableHeader + tableRows.join('\n');

            const messageData = {
                channel_id: channel_id,
                message: "",
                props: {
                    attachments: [
                        {
                            text: table,
                            actions: [
                                {
                                    name: "Hủy bỏ",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/cancel-send-list-request`,
                                        context: {
                                            action: "delete_message",
                                            value: "cancel"
                                        }
                                    },
                                    style: "secondary"
                                },
                                {
                                    name: "Gửi danh sách kiến nghị",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/confirm-send-list-request`,
                                        context: {
                                            action: "delete_message",
                                            value: "delete"
                                        }
                                    },
                                    style: "primary",
                                }
                            ]

                        }
                    ]
                }
            };
            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Message sent:', response.data);
            res.status(200).send();
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling delete request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleCancelSendListRequest = async (req, res) => {
    try {
        const { channel_id } = req.body;
        let post_id = req.body.post_id || '';

        console.log(req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        if (post_id) {
            await axios.delete(`${POST_URL}/${post_id}`, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            res.status(200).send();
        }

        try {
            const messageData = {
                channel_id: channel_id,
                message: "Đã hủy gửi danh sách kiến nghị",
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            res.status(200).send();
        } catch (error) {
            console.error('Error handling cancellation:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling add request:', error);
        return res.status(500).send();
    }
}

const handleConfirmSendListRequest = async (req, res) => {
    try {
        console.log('Send list request');
        const { channel_id, team_id } = req.body;
        let post_id = req.body.post_id || '';
        console.log(req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền gửi kiến nghị`,
            };


            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        // Kiểm tra xem người dùng có quyền sửa kiến nghị không
        if (user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền gửi kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (post_id) {
            await axios.delete(`${POST_URL}/${post_id}`, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            res.status(200).send();
        }


        if (lstBot[0].channelIds[0] === channel_id) {
            let lstRequest = await RequestModal.find();
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);
            // console.log(lstRequest);

            try {
                // Thông báo đã gửi danh sách kiến nghị đến kênh "Phòng dân quyền UBND Thành Phố" thành công
                const messageData = {
                    channel_id: channel_id,
                    message: "Danh sách kiến nghị đã được gửi đến kênh **Phòng dân quyền UBND Thành Phố**",
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                const bots = await axios.get(BOTS_URL,
                    {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        }
                    });

                console.log('Bots:', bots.data);

                // Lấy ra channel id của kênh "Phòng dân quyền UBND Thành Phố"

                const channel = await axios.get(`${TEAM_URL}/${team_id}/channels/name/phong-dan-nguyen-ubnd-thanh-pho`, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                console.log(channel);

                const channel_id_phong_dan_nguyen = channel.data.id;

                // Đổi trạng thái của các kiến nghị đã gửi thành REQUEST_STATUS.SENT

                lstRequest.forEach(async (request) => {
                    request.status = REQUEST_STATUS.SENT;
                    await request.save();
                }
                );

                const tableTitle = "## Danh sách kiến nghị";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

                const tableRows = lstRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const receivedDate = new Date(request.receivedDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                    const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
                });

                const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                const messageDataPhongDanNguyen = {
                    channel_id: channel_id_phong_dan_nguyen,
                    message: "Vừa nhận được danh sách kiến nghị của quận huyện gửi đến",
                    props: {
                        attachments: [
                            {
                                text: table,
                            }
                        ]
                    }
                };

                const response = await axios.post(MESSAGE_URL, messageDataPhongDanNguyen, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Message sent:', response.data);



                res.status(200).send();

            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }
        }

        else if (lstBot[1].channelIds[0] === channel_id) {

            let dataRequest = await RequestModal.find();
            dataRequest = dataRequest.filter((request) => request.status === REQUEST_STATUS.SENT);
            // console.log(lstRequest);

            try {
                // Lấy ra user là admin với role là admin và channel_id là channel_id
                const admin = await UserModel.findOne({ role: 'admin', channelId: channel_id });
                console.log('Admin', admin);

                // Tạo một tin nhắn
                const message = `@${admin.username} người dùng **${req.body.user_name}** đã gửi danh sách kiến nghị`;

                // Gửi tin nhắn
                await axios.post(MESSAGE_URL, {
                    channel_id: channel_id,
                    message: message
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + MATTERMOST_ACCESS_BOT_TP,
                        'Content-Type': 'application/json'
                    }
                });

            } catch (error) {
                console.error('Error sending message:', error);
            }

            // Cập nhận trạng thái của dataRequest thành REQUEST_STATUS.PENDING

            dataRequest.forEach(async (request) => {
                request.status = REQUEST_STATUS.PENDING;
                await request.save();
            });

            // Thông báo trực tiếp cho admin
            try {
                const admin = await UserModel.findOne({ role: 'admin', channelId: channel_id });

                const botId = lstBot[1].botUserId;

                const directMessage = await axios.post(DIRECT_URL, [
                    botId,
                    admin.userId
                ], {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                const channelId = directMessage.data.id;

                const message = `Đã nhận được danh sách kiến nghị mới`;

                const tableTitle = "## Danh sách kiến nghị";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

                const tableRows = dataRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const receivedDate = new Date(request.receivedDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                    const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
                });
                const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                await axios.post(MESSAGE_URL, {
                    channel_id: channelId,
                    message: message,
                    props: {
                        attachments: [
                            {
                                text: table,
                                actions: [
                                    {
                                        name: "Xin ý kiến",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-request-to-advice`,
                                            context: {
                                                action: "approve"
                                            }
                                        },
                                        style: "primary"
                                    },
                                    {
                                        name: "Bình luận kiến nghị",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/select-request-to-comment`,
                                            context: {
                                                action: "comment"
                                            }
                                        },
                                        style: "primary"
                                    }
                                ]
                            }
                        ]
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();

            } catch (error) {
                console.error('Error sending message:', error);
                return res.status(500).send();
            }

        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling send list request:', error);
        return res.status(500).send('Internal Server Error');
    }
};

const handleRequestToEdit = async (req, res) => {
    try {
        // Gửi thông báo message cho user trong đó có danh sách các kiến nghị có thể sửa
        const { channel_id, user_id } = req.body;
        console.log(req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        let lstRequest = await RequestModal.find();

        if (access === MATTERMOST_ACCESS)
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);
        else
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.SENT);

        const lstData = lstRequest.map((request, index) => {
            return {
                text: request.code,
                value: request.code
            }
        });

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền sửa kiến nghị`,
            };


            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        // Kiểm tra xem người dùng có quyền sửa kiến nghị không
        if (user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền sửa kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }


        if (lstBot[0].channelIds[0] === channel_id) {
            try {
                const messageData = {
                    channel_id: channel_id,
                    message: "",
                    props: {
                        attachments: [
                            {
                                text: "### Chọn kiến nghị cần sửa",

                                actions: [
                                    {
                                        "id": "actionoptions",
                                        "name": "Vui lòng chọn kiến nghị",
                                        "integration": {
                                            "url": `${NGROK_URL}/api/request-mattermost/open-edit-request`,
                                            "context": {
                                                "action": "do_something"
                                            }
                                        },
                                        "type": "select",
                                        "options": lstData
                                    },
                                ]

                            }
                        ]
                    }
                };
                const response = await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Message sent:', response.data);
                res.status(200).send();
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }

        }

        else if (lstBot[1].channelIds[0] === channel_id) {
            try {
                const messageData = {
                    channel_id: channel_id,
                    message: "",
                    props: {
                        attachments: [
                            {
                                text: "### Chọn kiến nghị cần sửa",

                                actions: [
                                    {
                                        "id": "actionoptions",
                                        "name": "Vui lòng chọn kiến nghị",
                                        "integration": {
                                            "url": `${NGROK_URL}/api/request-mattermost/open-edit-request`,
                                            "context": {
                                                "action": "do_something"
                                            }
                                        },
                                        "type": "select",
                                        "options": lstData
                                    },
                                ]

                            }
                        ]
                    }
                };
                const response = await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Message sent:', response.data);
                res.status(200).send();
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }
            return res.status(200).send();
        }
    } catch (error) {
        console.error('Error handling request to edit:', error);
        return res.status(500).send('Internal Server Error');
    }
}


const handleOpenEditRequest = async (req, res) => {
    try {
        const response_url = req.body.response_url;
        const trigger_id = req.body.trigger_id;
        const channel_id = req.body.channel_id;

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        console.log('Open edit request', req.body);
        let text = '';

        if (req.body.text) {
            text = req.body.text;
        }
        else if (req.params.code) {
            text = req.params.code;
        }
        else if (req.body.context?.selected_option) {
            text = req.body.context.selected_option;
        }
        console.log(text);

        let post_id = req.body.post_id || '';
        // Lấy ra kiến nghị có code là text
        const request = await RequestModal.findOne({ code: text });

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền sửa kiến nghị`,
            };


            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        // Kiểm tra xem người dùng có quyền sửa kiến nghị không
        if (user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền sửa kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }


        if (lstBot[0].channelIds[0] === channel_id) {
            if (request && request.status !== REQUEST_STATUS.IDLE) {
                const messageData = {
                    channel_id: channel_id,
                    message: `Kiến nghị mã **${request.code}** không có trong danh sách, không thể sửa`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                return res.status(200).send();
            }
        }

        else if (lstBot[1].channelIds[0] === channel_id) {
            if (request && request.status !== REQUEST_STATUS.SENT) {
                const messageData = {
                    channel_id: channel_id,
                    message: `Kiến nghị mã **${request.code}** không có trong danh sách, không thể sửa`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();
            }
        }


        if (!request) {
            let messageData = {};

            text ?
                messageData = {
                    channel_id: channel_id,
                    message: `Không tìm thấy kiến nghị với mã **${text}**`,
                } :
                messageData = {
                    channel_id: channel_id,
                    message: `Không tìm thấy kiến nghị, vui lòng nhập mã kiến nghị`,
                }

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        // let lstCategory = await CategoryModal.find();
        // lstCategory = lstCategory.map((item) => {
        //     return {
        //         text: item.description,
        //         value: item._id
        //     };
        // });
        // console.log(req.body);
        // console.log(lstCategory);

        console.log(response_url, trigger_id, channel_id);

        console.log(request);

        let parts = request.receivedDate.split("/");

        let day = parts[0];
        let month = parts[1];
        let year = parts[2];

        const dialog = {
            trigger_id: trigger_id,
            url: `${NGROK_URL}/api/request-mattermost/edit-request/${request._id}`,
            dialog: {
                callback_id: 'somecallbackid',
                title: 'Sửa kiến nghị',
                "elements": [
                    {
                        "display_name": "Tiêu đề",
                        "name": "title",
                        "type": "text",
                        "subtype": "",
                        "default": request.title,
                        "placeholder": "Vui lòng nhập tiêu đề",
                        "help_text": "",
                        "optional": false,
                        "requiredText": "Vui lòng nhập tiêu đề"
                    },
                    {
                        "display_name": "Nội dung",
                        "name": "content",
                        "type": "textarea",
                        "subtype": "",
                        "default": request.content,
                        "placeholder": "Vui lòng nhập nội dung",
                        "help_text": "",
                        "optional": false,
                        "max_length": 50000,
                    },
                    {
                        "display_name": "Ngày nhận kiến nghị",
                        "name": "receivedDay",
                        "type": "select",
                        "subtype": "",
                        "default": day,
                        "placeholder": "Vui lòng chọn ngày nhận kiến nghị",
                        "help_text": "",
                        "optional": false,
                        options: optionDay,
                    },
                    {
                        "display_name": "Tháng nhận kiến nghị",
                        "name": "receivedMonth",
                        "type": "select",
                        "subtype": "",
                        "default": month,
                        "placeholder": "Vui lòng chọn tháng nhận kiến nghị",
                        "help_text": "",
                        "optional": false,
                        options: optionMonth,
                    },
                    {
                        "display_name": "Năm nhận kiến nghị",
                        "name": "receivedYear",
                        "type": "select",
                        "subtype": "",
                        "default": year,
                        "placeholder": "Vui lòng chọn năm nhận kiến nghị",
                        "help_text": "",
                        "optional": false,
                        options: optionYear,
                    },
                    {
                        "display_name": "Danh mục",
                        "name": "category",
                        "type": "text",
                        "placeholder": "Vui lòng nhập danh mục",
                        "default": request.category,
                        "help_text": "",
                        "optional": false,
                        "requiredText": "Vui lòng nhập danh mục"
                    }
                ],
                notify_on_cancel: true,
                state: JSON.stringify({ response_url, channel_id, trigger_id, post_id })
            }
        };

        console.log(dialog);

        await axios.post(DIALOG_URL, dialog, {
            headers: {
                'Authorization': `Bearer ${access}`,
                'Content-Type': 'application/json',
            }
        })
            .then((e) => {
                res.status(200).send();
                console.log(e.data);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Internal Server Error');
            });
    } catch (error) {
        console.error('Error handling open edit request:', error);
        return res.status(500).send('Internal Server Error');
    }
};

const handleEditRequest = async (req, res) => {
    try {
        const state = JSON.parse(req.body.state);
        const channel_id = state.channel_id;
        const post_id = state.post_id;
        const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
        console.log('Edit request');
        console.log(state);
        console.log(req.body);

        const lstBot = await BotModel.find();

        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        if (req.body.cancelled) {
            if (post_id) {
                await axios.delete(`${POST_URL}/${post_id}`, {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

            }
        }

        try {
            const reqRequest = {
                title: req.body.submission.title,
                content: replaceText(req.body.submission.content),
                receivedDate: (`${req.body.submission.receivedDay}/${req.body.submission.receivedMonth}/${req.body.submission.receivedYear}`),
                category: req.body.submission.category,
            }

            console.log('Edit request ', reqRequest);

            if (!reqRequest.title || !reqRequest.content || !reqRequest.receivedDate || !reqRequest.category) {
                return res.status(200).send();
            }

            await axios.put(`${urlAddRequest}/${req.params.id}`, reqRequest)
                .then(async (e) => {
                    console.log(e.data);

                    // Lấy ra người dùng có id là user_id
                    const user = await UserModel.findOne({ userId: req.body.user_id });

                    if (!user) {
                        return res.status(404).send('User not found');
                    }

                    let lstRequest = await RequestModal.find();
                    let action = [];
                    if (lstBot[0].channelIds[0] === channel_id) {
                        lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);

                        action = [
                            {
                                name: "Thêm kiến nghị mới",
                                type: "button",
                                integration: {
                                    url: `${NGROK_URL}/api/request-mattermost/open-dialog-request`,
                                    context: {
                                        action: "view"
                                    }
                                },
                                style: "primary"
                            },
                            {
                                name: "Sửa kiến nghị",
                                type: "button",
                                integration: {
                                    url: `${NGROK_URL}/api/request-mattermost/open-request-to-edit`,
                                    context: {
                                        action: "edit"
                                    }
                                },
                                style: "primary",
                            },
                            {
                                name: "Loại bỏ kiến nghị",
                                type: "button",
                                integration: {
                                    url: `${NGROK_URL}/api/request-mattermost/open-delete-request`,
                                    context: {
                                        action: "delete"
                                    }
                                },
                                style: "primary",
                            },
                            {
                                name: "Gửi danh sách kiến nghị",
                                type: "button",
                                integration: {
                                    url: `${NGROK_URL}/api/request-mattermost/send-list-request`,
                                    context: {
                                        action: "send"
                                    }
                                },
                                style: "primary"
                            }
                        ]


                    }
                    else if (lstBot[1].channelIds[0] === channel_id) {
                        lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.SENT);

                        action = [
                            {
                                name: "Sửa kiến nghị",
                                type: "button",
                                integration: {
                                    url: `${NGROK_URL}/api/request-mattermost/open-request-to-edit`,
                                    context: {
                                        action: "edit"
                                    }
                                },
                                style: "primary",
                            },
                            {
                                name: "Loại bỏ kiến nghị",
                                type: "button",
                                integration: {
                                    url: `${NGROK_URL}/api/request-mattermost/open-delete-request`,
                                    context: {
                                        action: "delete"
                                    }
                                },
                                style: "primary",
                            },
                            {
                                name: "Gửi danh sách kiến nghị",
                                type: "button",
                                integration: {
                                    url: `${NGROK_URL}/api/request-mattermost/send-list-request`,
                                    context: {
                                        action: "send"
                                    }
                                },
                                style: "primary"
                            }
                        ]
                    }


                    console.log(lstRequest);


                    if (post_id) {
                        await axios.delete(`${POST_URL}/${post_id}`, {
                            headers: {
                                'Authorization': `Bearer ${access}`,
                                'Content-Type': 'application/json',
                            }
                        });

                    }

                    if (lstRequest.length === 0) {
                        try {
                            const messageData = {
                                channel_id: channel_id,
                                message: `Không có kiến nghị nào mới được thêm`,
                                props: {
                                    attachments: [
                                        {
                                            text: "## Vui lòng thêm kiến nghị mới",
                                            actions: [
                                                {
                                                    name: "Thêm kiến nghị mới",
                                                    type: "button",
                                                    integration: {
                                                        url: `${NGROK_URL}/api/request-mattermost/open-dialog-request`,
                                                        context: {
                                                            action: "view"
                                                        }
                                                    },
                                                    style: "primary"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            };

                            await axios.post(MESSAGE_URL, messageData, {
                                headers: {
                                    'Authorization': `Bearer ${access}`,
                                    'Content-Type': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                }
                            });

                            res.status(200).send();
                        } catch (error) {
                            console.error('Error sending message:', error);
                            res.status(500).send();
                        }

                        return res.status(200).send();
                    }

                    // Hiển thị danh sách kiến nghị 
                    try {
                        const tableTitle = "## Danh sách kiến nghị";
                        const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

                        const tableRows = lstRequest.map((request, index) => {
                            const date = new Date(request.createdDate);
                            const receivedDate = new Date(request.receivedDate);
                            const formattedDate = date.toLocaleDateString('vi-VN');
                            const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                            const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
                            return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
                        });
                        const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                        const messageData = {
                            channel_id: channel_id,
                            message: `Người dùng **${req.body.user_name || user.username}** đã sửa kiến nghị với mã **${e.data.code}**`,
                            props: {
                                attachments: [
                                    {
                                        text: table,
                                        actions: action
                                    }
                                ]
                            }
                        };

                        const response = await axios.post(MESSAGE_URL, messageData, {
                            headers: {
                                'Authorization': `Bearer ${access}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        console.log('Message sent:', response.data);
                        res.status(200).send();
                    } catch (error) {
                        console.error('Error sending message:', error);
                        res.status(500).send();
                    }

                })
                .catch(err => {
                    console.error(err);
                });

        } catch (error) {
            console.error('Error handling cancellation:', error);
            res.status(500).send();
        }
    } catch (error) {
        console.error('Error handling edit request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleOpenDeleteRequest = async (req, res) => {
    try {
        // Gửi thông báo message cho user trong đó có danh sách các kiến nghị có thể sửa
        const { channel_id, user_id } = req.body;
        console.log(req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        let lstRequest = await RequestModal.find();

        if (access === MATTERMOST_ACCESS)
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);
        else
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.SENT);

        const lstData = lstRequest.map((request, index) => {
            return {
                text: request.code,
                value: request.code
            }
        });

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền loại bỏ kiến nghị`,
            };


            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        // Kiểm tra xem người dùng có quyền sửa kiến nghị không
        if (user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền loại bỏ kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }


        try {
            const messageData = {
                channel_id: channel_id,
                message: "",
                props: {
                    attachments: [
                        {
                            text: "### Chọn kiến nghị muốn loại bỏ",

                            actions: [
                                {
                                    "id": "actionoptions",
                                    "name": "Vui lòng chọn kiến nghị",
                                    "integration": {
                                        "url": `${NGROK_URL}/api/request-mattermost/delete-request`,
                                        "context": {
                                            "action": "do_something"
                                        }
                                    },
                                    "type": "select",
                                    "options": lstData
                                },
                            ]

                        }
                    ]
                }
            };
            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Message sent:', response.data);
            res.status(200).send();
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling open delete request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleDeleteRequest = async (req, res) => {
    try {
        const { channel_id } = req.body;
        let post_id = req.body.post_id || '';
        console.log(req.body);

        let text = '';

        if (req.body.text) {
            text = req.body.text;
        }
        else if (req.params.code) {
            text = req.params.code;
        }
        else if (req.body.context?.selected_option) {
            text = req.body.context.selected_option;
        }

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;


        // Lấy ra kiến nghị có code là text
        const request = await RequestModal.findOne({ code: text });
        console.log(request);
        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền loại bỏ kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        // Kiểm tra xem người dùng có quyền sửa kiến nghị không
        if (user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền loại bỏ kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (lstBot[0].channelIds[0] === channel_id) {
            if (request && request.status !== REQUEST_STATUS.IDLE) {
                const messageData = {
                    channel_id: channel_id,
                    message: `Kiến nghị mã **${request.code}** không có trong danh sách, không thể loại bỏ`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                return res.status(200).send();
            }
        }

        else if (lstBot[1].channelIds[0] === channel_id) {
            if (request && request.status !== REQUEST_STATUS.SENT) {
                const messageData = {
                    channel_id: channel_id,
                    message: `Kiến nghị mã **${request.code}** không có trong danh sách, không thể loại bỏ`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();
            }
        }

        if (post_id) {
            await axios.delete(`${POST_URL}/${post_id}`, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
        }

        if (!request) {
            let messageData = {};

            text ?
                messageData = {
                    channel_id: channel_id,
                    message: `Không tìm thấy kiến nghị với mã **${text}**`,
                }
                :
                messageData = {
                    channel_id: channel_id,
                    message: `Không tìm thấy kiến nghị, vui lòng nhập mã kiến nghị`,
                }


            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        try {
            const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');
            const formattedReceivedDate = new Date(request.receivedDate).toLocaleDateString('vi-VN');
            let messageData = {}


            if (lstBot[0].channelIds[0] === channel_id) {
                messageData = {
                    channel_id: channel_id,
                    message: "",
                    props: {
                        attachments: [
                            {
                                text: "### Bạn có thật sự muốn loại bỏ kiến nghị này?",
                                fields: [
                                    { title: "Mã kiến nghị", value: text, short: true },
                                    { title: "Tiêu đề", value: request.title, short: true },
                                    { title: "Ngày tạo", value: formattedDate, short: true },
                                    { title: "Ngày nhận", value: formattedReceivedDate, short: true },
                                    { title: "Danh mục", value: request.category, short: true },
                                    { title: "Trạng thái", value: getStatus(request.status), short: true },
                                    { title: "Nội dung", value: request.content, short: false },
                                ],
                                actions: [
                                    {
                                        name: "Hủy bỏ",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/cancel-delete-request`,
                                            context: {
                                                action: "delete_message",
                                                value: "cancel"
                                            }
                                        },
                                        style: "secondary"
                                    },
                                    {
                                        name: "Loại bỏ",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/confirm-delete-request/${request._id}`,
                                            context: {
                                                action: "delete_message",
                                                value: "delete"
                                            }
                                        },
                                        style: "primary",
                                    }
                                ]

                            }
                        ]
                    }
                };
            }
            else if (lstBot[1].channelIds[0] === channel_id) {
                messageData = {
                    channel_id: channel_id,
                    message: "",
                    props: {
                        attachments: [
                            {
                                text: "### Bạn có thật sự muốn loại bỏ kiến nghị này?",
                                fields: [
                                    { title: "Mã kiến nghị", value: text, short: true },
                                    { title: "Tiêu đề", value: request.title, short: true },
                                    { title: "Ngày tạo", value: formattedDate, short: true },
                                    { title: "Ngày nhận", value: formattedReceivedDate, short: true },
                                    { title: "Danh mục", value: request.category, short: true },
                                    { title: "Trạng thái", value: getStatus(request.status), short: true },
                                    { title: "Nội dung", value: request.content, short: false },
                                ],
                                actions: [
                                    {
                                        name: "Hủy bỏ",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/cancel-delete-request`,
                                            context: {
                                                action: "delete_message",
                                                value: "cancel"
                                            }
                                        },
                                        style: "secondary"
                                    },
                                    {
                                        name: "Loại bỏ",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-confirm-delete-request/${request._id}`,
                                            context: {
                                                action: "delete_message",
                                                value: "delete"
                                            }
                                        },
                                        style: "primary",
                                    }
                                ]

                            }
                        ]
                    }
                };
            }


            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Message sent:', response.data);
            res.status(200).send();
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling delete request:', error);
        return res.status(500).send('Internal Server Error');
    }
};

const handleCancelDeleteRequest = async (req, res) => {
    try {
        const { post_id, user_name } = req.body;
        const channel_id = req.body.channel_id;

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        console.log(req.body);
        try {
            await axios.delete(`${POST_URL}/${post_id}`, {
                headers: {
                    'Authorization': `Bearer ${access}`,

                }
            });
        }
        catch (error) {
            console.error('Error sending message:', error);
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling cancel delete request:', error);
        return res.status(500).send('Internal Server Error');

    }
}

const handleOpenConfirmDeleteRequest = async (req, res) => {
    try {
        const response_url = req.body.response_url;
        const trigger_id = req.body.trigger_id;
        const channel_id = req.body.channel_id;
        const post_id = req.body.post_id;

        // Lấy ra kiến nghị có code là text
        const request = await RequestModal.findOne({ _id: req.params.id });

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền loại bỏ kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }


        console.log(response_url, trigger_id, channel_id);

        console.log(request);
        const dialog = {
            trigger_id: trigger_id,
            url: `${NGROK_URL}/api/request-mattermost/confirm-delete-request/${request._id}`,
            dialog: {
                callback_id: 'somecallbackid',
                title: 'Lý do loại bỏ kiến nghị',
                "elements": [
                    {
                        "display_name": "Nội dung",
                        "name": "content",
                        "type": "textarea",
                        "subtype": "",
                        "default": "",
                        "placeholder": "Vui lòng nhập nội dung",
                        "help_text": "",
                        "optional": false,
                        "max_length": 50000,
                    }
                ],
                notify_on_cancel: true,
                state: JSON.stringify({ response_url, channel_id, trigger_id, post_id })
            }
        };

        console.log(dialog);

        await axios.post(DIALOG_URL, dialog, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                'Content-Type': 'application/json',
            }
        })
            .then((e) => {
                res.status(200).send();
                console.log(e.data);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Internal Server Error');
            });

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling open comment request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleConfirmDeleteRequest = async (req, res) => {
    try {
        let state = {}
        if (req.body.state) {
            state = JSON.parse(req.body.state);
        }
        const channel_id = req.body.channel_id;
        // const { post_id, user_name } = req.body;

        let post_id = req.body.post_id || state?.post_id;

        const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
        console.log('Delete request');
        console.log(req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        // Thay đổi trạng thái của kiến nghị thành đã bị từ chối
        const request = await RequestModal.findOne({ _id: req.params.id });
        request.status = REQUEST_STATUS.REJECTED;
        await request.save();

        // console.log(e.data);
        await axios.delete(`${POST_URL}/${post_id}`, {
            headers: {
                'Authorization': `Bearer ${access}`,
                'Content-Type': 'application/json',
            }
        });

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });

        if (!user) {
            return res.status(404).send('User not found');
        }

        let lstRequest = await RequestModal.find();
        let action = []
        if (lstBot[0].channelIds[0] === channel_id) {
            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);
            action = [
                {
                    name: "Thêm kiến nghị mới",
                    type: "button",
                    integration: {
                        url: `${NGROK_URL}/api/request-mattermost/open-dialog-request`,
                        context: {
                            action: "view"
                        }
                    },
                    style: "primary"
                },
                {
                    name: "Sửa kiến nghị",
                    type: "button",
                    integration: {
                        url: `${NGROK_URL}/api/request-mattermost/open-request-to-edit`,
                        context: {
                            action: "edit"
                        }
                    },
                    style: "primary",
                },
                {
                    name: "Loại bỏ kiến nghị",
                    type: "button",
                    integration: {
                        url: `${NGROK_URL}/api/request-mattermost/open-delete-request`,
                        context: {
                            action: "delete"
                        }
                    },
                    style: "primary",
                },
                {
                    name: "Gửi danh sách kiến nghị",
                    type: "button",
                    integration: {
                        url: `${NGROK_URL}/api/request-mattermost/send-list-request`,
                        context: {
                            action: "send"
                        }
                    },
                    style: "primary"
                }
            ]
        }
        else if (lstBot[1].channelIds[0] === channel_id) {

            const reqRequest = {
                content: req.body.submission.content,
            }

            if (!reqRequest.content) {
                return res.status(200).send();
            }

            request.comments.push({
                content: req.body.submission.content,
                username: req.body.user_name || user.username,
            })

            await request.save();


            lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.SENT);
            action = [
                {
                    name: "Sửa kiến nghị",
                    type: "button",
                    integration: {
                        url: `${NGROK_URL}/api/request-mattermost/open-request-to-edit`,
                        context: {
                            action: "edit"
                        }
                    },
                    style: "primary",
                },
                {
                    name: "Loại bỏ kiến nghị",
                    type: "button",
                    integration: {
                        url: `${NGROK_URL}/api/request-mattermost/open-delete-request`,
                        context: {
                            action: "delete"
                        }
                    },
                    style: "primary",
                },
            ]
        }

        console.log(lstRequest);

        if (lstRequest.length === 0) {
            try {
                const messageData = {
                    channel_id: channel_id,
                    message: `Không có kiến nghị nào mới được thêm`,
                    props: {
                        attachments: [
                            {
                                text: "## Vui lòng thêm kiến nghị mới",
                                actions: [
                                    {
                                        name: "Thêm kiến nghị mới",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-dialog-request`,
                                            context: {
                                                action: "view"
                                            }
                                        },
                                        style: "primary"
                                    }
                                ]
                            }
                        ]
                    }
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                res.status(200).send();
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }

            return res.status(200).send();
        }

        const tableTitle = "## Danh sách kiến nghị";
        const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

        const tableRows = lstRequest.map((request, index) => {
            const date = new Date(request.createdDate);
            const formattedDate = date.toLocaleDateString('vi-VN');
            const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
            return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
        });
        const table = [tableTitle, tableHeader, ...tableRows].join('\n');

        const messageData = {
            channel_id: channel_id,
            message: `Người dùng **${req.body.user_name || user.username}** đã loại bỏ kiến nghị với mã **${request.code}**`,
            props: {
                attachments: [
                    {
                        text: table,
                        actions: action,
                    }
                ]
            }
        };

        try {
            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Message sent:', response.data);
            res.status(200).send();
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }



        return res.status(200).send();
    } catch (error) {
        console.error('Error handling confirm delete request:', error);
        return res.status(500).send('Internal Server Error');
    }
}


const handleRequestToAdvice = async (req, res) => {
    try {
        // Gửi thông báo message cho user trong đó có danh sách các kiến nghị có thể sửa
        const { channel_id, user_id } = req.body;
        console.log('Advice to Request ', req.body);
        let user_mention = req.body.user_mentions;
        const text = req.body.text.split(' ')[0];
        console.log('Text', text);
        console.log('User mention', user_mention);

        const lstBot = await BotModel.find();

        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        const user = await UserModel.findOne({ userId: req.body.user_id });

        if (req.body.user_name !== 'qlp-dannguyen-thanhpho') {

            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền xin ý kiến kiến nghị`,
            }

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        let request = await RequestModal.findOne({
            code: text
        });

        console.log('Request', request);

        if (!request) {
            const messageData = {
                channel_id: channel_id,
                message: `Không tìm thấy kiến nghị với mã **${text}**`,
            }

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        try {

            // Thông báo đã gửi kiến nghị cho người được chọn
            const messageData = {
                channel_id: channel_id,
                message: `Đã xin ý kiến kiến nghị mã **${request.code}**`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            request.status = REQUEST_STATUS.WAITING;
            await request.save();

            // Add advice to request

            // Kiểm tra xem user_mention có phải là mảng không
            if (!Array.isArray(user_mention)) {
                user_mention = [user_mention];
            }

            const lstAdvice = user_mention.map((user) => {
                request.advice.push({
                    username: user,
                    isAdvice: false,
                });
            });
            console.log('List advice', lstAdvice);
            // request.advice = lstAdvice
            await request.save();

            user_mention.map(async (user) => {
                const userSend = await UserModel.findOne({ username: user });
                console.log(userSend);
                // Gửi thông báo đến userSend 
                const botId = lstBot[1].botUserId;

                const directMessage = await axios.post(DIRECT_URL, [
                    botId,
                    userSend.userId
                ], {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                const channelId = directMessage.data.id;

                console.log(channelId);

                const message = `Đã có kiến nghị mới cần bạn xem xét, mã kiến nghị: **${request.code}**`;
                const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

                await axios.post(MESSAGE_URL, {
                    channel_id: channelId,
                    message: message,
                    props: {
                        attachments: [
                            {
                                text: `#### Thông tin kiến nghị mới`,
                                fields: [
                                    { title: "Mã kiến nghị", value: request.code, short: true },
                                    { title: "Tiêu đề", value: request.title, short: true },
                                    { title: "Ngày tạo", value: formattedDate, short: true },
                                    { title: "Ngày nhận", value: request.receivedDate, short: true },
                                    { title: "Danh mục", value: request.category, short: true },
                                    { title: "Trạng thái", value: getStatus(request.status), short: true },
                                    { title: "Nội dung", value: request.content, short: false },
                                ],
                                actions: [
                                    {
                                        name: "Chấp thuận",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/approve-request/${request._id}`,
                                            context: {
                                                action: "approve"
                                            }
                                        },
                                        style: "primary"
                                    },
                                    {
                                        name: "Bình luận",
                                        type: "button",
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-comment-request/${request._id}`,
                                            context: {
                                                action: "comment"
                                            }
                                        },
                                        style: "danger"
                                    }
                                ]
                            }
                        ]
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });
            });

            res.status(200).send();

        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling request to advice:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleOpenAdviceDialog = async (req, res) => {
    try {
        const { post_id, user_name, trigger_id, channel_id } = req.body;
        console.log(req.body);
        console.log(req.params);

        let id = req.params.id || req.body.context.selected_option;

        console.log(id);

        try {

            // Hiển thị ra dialog chọn người muốn gửi kiến nghị

            const users = await UserModel.find({ role: 'admin' });

            const bot = await BotModel.findOne();

            // Lấy ra các user admin mà có channel id khác với channel id của lst bot

            let lstUser = []

            users.map((user) => {
                if (user.channelId !== process.env.CHANNEL_ID1 && user.channelId !== process.env.CHANNEL_ID2) {
                    lstUser.push(user);
                }
            });

            console.log('Lst user', lstUser);


            const dialog = {
                trigger_id: trigger_id,
                url: `${NGROK_URL}/api/request-mattermost/advice-request/${id}`,
                dialog: {
                    callback_id: 'somecallbackid',
                    title: 'Xin ý kiến kiến nghị',
                    "elements": [
                        {
                            "display_name": "Lãnh đạo các ban",
                            "name": "user",
                            "type": "select",
                            "placeholder": "Vui lòng chọn lãnh đạo các ban",
                            "options": lstUser.map((user) => {
                                return {
                                    text: user.username,
                                    value: user.userId
                                }
                            })
                        },
                    ],
                    notify_on_cancel: true,
                    state: JSON.stringify({ channel_id, trigger_id, post_id })
                }
            };

            console.log(dialog);

            await axios.post(DIALOG_URL, dialog, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json',
                }
            });

            res.status(200).send();
        }
        catch (error) {
            res.status(500).send('Error handling cancellation');

            console.error('Error sending message:', error);
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling open advice dialog:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleAdviceRequest = async (req, res) => {
    try {
        const state = JSON.parse(req.body.state);
        const channel_id = state.channel_id;
        const post_id = state.post_id;
        console.log('Advice request');
        console.log(state);
        console.log(req.body);

        if (req.body.cancelled) {
            if (post_id) {
                await axios.delete(`${POST_URL}/${post_id}`, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                return res.status(200).send();

            }
        }

        try {

            const userSend = await UserModel.findOne({ userId: req.body.submission.user });
            console.log(userSend);
            // Lấy ra user hiện tại

            const user = await UserModel.findOne({ userId: req.body.user_id });
            console.log(user);


            const request = await RequestModal.findOne({ _id: req.params.id });
            console.log(request);
            request.status = REQUEST_STATUS.WAITING;
            await request.save();

            const lstBot = await BotModel.find();

            const channelIdDanNguyen = lstBot[1].channelIds[0];

            // Loại bỏ đi post hiện tại
            await axios.delete(`${POST_URL}/${post_id}`, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`
                }
            });

            // Thông báo đã gửi kiến nghị cho người được chọn
            const messageData = {
                channel_id: channel_id,
                message: `Đã xin ý kiến kiến nghị mã **${request.code}** với lãnh đạo ban **${userSend.username}**`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            // Gửi thông báo đến userSend 
            const botId = lstBot[1].botUserId;

            const directMessage = await axios.post(DIRECT_URL, [
                botId,
                userSend.userId
            ], {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            const channelId = directMessage.data.id;

            console.log(channelId);

            const message = `Đã có kiến nghị mới cần bạn xem xét, mã kiến nghị: **${request.code}**`;
            const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

            await axios.post(MESSAGE_URL, {
                channel_id: channelId,
                message: message,
                props: {
                    attachments: [
                        {
                            text: `#### Thông tin kiến nghị mới`,
                            fields: [
                                { title: "Mã kiến nghị", value: request.code, short: true },
                                { title: "Tiêu đề", value: request.title, short: true },
                                { title: "Ngày tạo", value: formattedDate, short: true },
                                { title: "Ngày nhận", value: request.receivedDate, short: true },
                                { title: "Danh mục", value: request.category, short: true },
                                { title: "Trạng thái", value: getStatus(request.status), short: true },
                                { title: "Nội dung", value: request.content, short: false },
                            ],
                            actions: [
                                {
                                    name: "Chấp thuận",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/approve-request/${request._id}`,
                                        context: {
                                            action: "approve"
                                        }
                                    },
                                    style: "primary"
                                },
                                {
                                    name: "Bình luận",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/open-comment-request/${request._id}`,
                                        context: {
                                            action: "comment"
                                        }
                                    },
                                    style: "danger"
                                }
                            ]
                        }
                    ]
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            const lengthDay = 1000 * 10;

            setTimeout(async () => {
                const request = await RequestModal.findOne({ _id: req.params.id });

                console.log(request);

                if (request.status === REQUEST_STATUS.WAITING) {
                    const messageData = {
                        channel_id: channelIdDanNguyen,
                        message: `Kiến nghị mã **${request.code}** đã xin ý kiến nhưng chưa được duyệt, vui lòng nhắc nhở lãnh đạo các ban duyệt kiến nghị`,
                    }

                    await axios.post(MESSAGE_URL, messageData, {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            }, lengthDay);

            res.status(200).send();

        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }
    } catch (error) {
        console.error('Error handling advice request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleApproveRequest = async (req, res) => {
    try {
        const request = await RequestModal.findOne({ _id: req.params.id });
        const lstBot = await BotModel.find();

        if (!request) {
            return res.status(404).send('Request not found');
        }

        console.log(request);

        if (request.advice && request.advice.length > 0) {
            const advice = request.advice.find((advice) => advice.username === req.body.user_name);
            if (advice) {
                advice.isAdvice = true;
                await request.save();
            }
            console.log('Advice', advice);

            const isAllAdvice = request.advice.every((advice) => advice.isAdvice === true);

            console.log('Is all advice', isAllAdvice);

            if (!isAllAdvice) {

                const message = {
                    channel_id: req.body.channel_id,
                    message: `Người dùng **${req.body.user_name}** đã chấp thuận kiến nghị mã **${request.code}**`,
                }

                await axios.post(MESSAGE_URL, message, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                const lstAdviceUser = request.advice.filter(advice => advice.username !== req.body.user_name).map((advice) => advice.username).join(", ");
                const channel_id = lstBot[1].channelIds[0];
                console.log('List advice user', lstAdviceUser);

                // Xóa đi post

                await axios.delete(`${POST_URL}/${req.body.post_id}`, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json',
                    }
                });


                const messageData = {
                    channel_id: channel_id,
                    message: `Người dùng **${req.body.user_name}** đã chấp thuận kiến nghị mã **${request.code}**, nhưng các ban khác: **${lstAdviceUser}** chưa chấp thuận kiến nghị này`,
                }

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });
                return res.status(200).send();
            }

            else if (isAllAdvice) {
                // Thay đổi trạng thái của kiến nghị
                request.status = REQUEST_STATUS.APPROVED;
                await request.save();

                console.log('Approve request', req.body);

                const user = await UserModel.findOne({ userId: req.body.user_id });

                if (!user) {
                    return res.status(404).send('User not found');
                }

                // Gửi thông báo cho người dùng đó là bạn đã phê duyệt kiến nghị

                const messageNoti = {
                    channel_id: req.body.channel_id,
                    message: `Kiến nghị mã **${request.code}** đã được chấp thuận`,
                }

                await axios.post(MESSAGE_URL, messageNoti, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Loại bỏ đi post hiện tại

                await axios.delete(`${POST_URL}/${req.body.post_id}`, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json',
                    }
                });

                const channel_id = lstBot[1].channelIds[0];

                const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

                // const messageData = {
                //     channel_id: channel_id,
                //     message: `Kiến nghị với mã **${request.code}** đã được chấp thuận`,
                // };

                // await axios.post(MESSAGE_URL, messageData, {
                //     headers: {
                //         'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                //         'Content-Type': 'application/json'
                //     }
                // });

                const message = `Kiến nghị mã **${request.code}** đã được quản lý các ban chấp thuận`;
                await axios.post(MESSAGE_URL, {
                    channel_id: lstBot[1].channelIds[0],
                    message: message,
                    props: {
                        attachments: [
                            {
                                text: `#### Thông tin kiến nghị đã được chấp thuận`,
                                fields: [
                                    { title: "Mã kiến nghị", value: request.code, short: true },
                                    { title: "Tiêu đề", value: request.title, short: true },
                                    { title: "Ngày tạo", value: formattedDate, short: true },
                                    { title: "Ngày nhận", value: request.receivedDate, short: true },
                                    { title: "Danh mục", value: request.category, short: true },
                                    { title: "Trạng thái", value: getStatus(request.status), short: true },
                                    { title: "Nội dung", value: request.content, short: false },
                                ],
                            }
                        ]
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        }
        else {
            // Thay đổi trạng thái của kiến nghị
            request.status = REQUEST_STATUS.APPROVED;
            await request.save();

            console.log('Approve request', req.body);

            const user = await UserModel.findOne({ userId: req.body.user_id });

            if (!user) {
                return res.status(404).send('User not found');
            }

            // Gửi thông báo cho người dùng đó là bạn đã phê duyệt kiến nghị

            const messageNoti = {
                channel_id: req.body.channel_id,
                message: `Kiến nghị mã **${request.code}** đã được chấp thuận`,
            }

            await axios.post(MESSAGE_URL, messageNoti, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            // Loại bỏ đi post hiện tại

            await axios.delete(`${POST_URL}/${req.body.post_id}`, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json',
                }
            });

            const channel_id = lstBot[1].channelIds[0];

            const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** đã chấp thuận kiến nghị với mã **${request.code}**`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            const message = `Kiến nghị mã **${request.code}** đã được quản lý các ban chấp thuận`;
            await axios.post(MESSAGE_URL, {
                channel_id: lstBot[1].channelIds[0],
                message: message,
                props: {
                    attachments: [
                        {
                            text: `#### Thông tin kiến nghị đã được chấp thuận`,
                            fields: [
                                { title: "Mã kiến nghị", value: request.code, short: true },
                                { title: "Tiêu đề", value: request.title, short: true },
                                { title: "Ngày tạo", value: formattedDate, short: true },
                                { title: "Ngày nhận", value: request.receivedDate, short: true },
                                { title: "Danh mục", value: request.category, short: true },
                                { title: "Trạng thái", value: getStatus(request.status), short: true },
                                { title: "Nội dung", value: request.content, short: false },
                            ],
                        }
                    ]
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });
        }
        return res.status(200).send();
    } catch (error) {
        console.error('Error handling approve request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleSelectRequestToComment = async (req, res) => {
    try {
        // Gửi thông báo message cho user trong đó có danh sách các kiến nghị có thể sửa
        const { channel_id, user_id } = req.body;
        console.log('request comment ', req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        let lstRequest = await RequestModal.find();

        lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.PENDING);

        const lstData = lstRequest.map((request, index) => {
            return {
                text: request.code,
                value: request._id
            }
        });

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền bình luận kiến nghị`,
            };


            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (user && user.role === 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền bình luận kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (req.body.user_name !== 'qlp-dannguyen-thanhpho') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** chỉ được bình luận kiến nghị được gửi`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        try {
            const messageData = {
                channel_id: channel_id,
                message: "",
                props: {
                    attachments: [
                        {
                            text: "### Chọn kiến nghị muốn bình luận",

                            actions: [
                                {
                                    "id": "actionoptions",
                                    "name": "Vui lòng chọn kiến nghị",
                                    "integration": {
                                        "url": `${NGROK_URL}/api/request-mattermost/open-comment-request`,
                                        "context": {
                                            "action": "do_something"
                                        }
                                    },
                                    "type": "select",
                                    "options": lstData
                                },
                            ]

                        }
                    ]
                }
            };
            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Message sent:', response.data);
            res.status(200).send();
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling open delete request:', error);
        return res.status(500).send('Internal Server Error');
    }


}


const handleOpenCommentRequest = async (req, res) => {
    try {
        const response_url = req.body.response_url;
        const trigger_id = req.body.trigger_id;
        const channel_id = req.body.channel_id;
        const post_id = req.body.post_id;


        let id = req.params.id || req.body.context.selected_option;

        // Lấy ra kiến nghị có code là text
        const request = await RequestModal.findOne({ _id: id });

        // Lấy ra người dùng có id là user_id
        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log('Open comment', req.body);
        if (!user) {
            // return res.status(404).send('User not found');
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền bình luận kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }


        console.log(response_url, trigger_id, channel_id);

        console.log(request);
        const dialog = {
            trigger_id: trigger_id,
            url: `${NGROK_URL}/api/request-mattermost/comment-request/${request._id}`,
            dialog: {
                callback_id: 'somecallbackid',
                title: 'Bình luận kiến nghị',
                "elements": [
                    {
                        "display_name": "Nội dung",
                        "name": "content",
                        "type": "textarea",
                        "subtype": "",
                        "default": "",
                        "placeholder": "Vui lòng nhập nội dung",
                        "help_text": "",
                        "optional": false,
                        "max_length": 50000,
                    }
                ],
                notify_on_cancel: true,
                state: JSON.stringify({ response_url, channel_id, trigger_id, post_id, user_name: req.body.user_name, user_id: req.body.user_id })
            }
        };

        console.log(dialog);

        await axios.post(DIALOG_URL, dialog, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                'Content-Type': 'application/json',
            }
        })
            .then((e) => {
                res.status(200).send();
                console.log(e.data);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Internal Server Error');
            });

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling open comment request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleCommentRequest = async (req, res) => {
    try {
        const state = JSON.parse(req.body.state);
        const channel_id = state.channel_id;
        const post_id = state.post_id;
        const user_name = state.user_name;
        const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
        console.log('Comment request');
        console.log(state);
        console.log(req.body);

        try {

            const reqRequest = {
                content: req.body.submission.content,
            }

            console.log('Comment request ', reqRequest);

            if (!reqRequest.content) {
                return res.status(200).send();
            }

            const request = await RequestModal.findOne({ _id: req.params.id });

            if (!request) {
                return res.status(404).send('Request not found');
            }

            console.log(request);

            // Thêm bình luận vào kiến nghị

            request.comments.push({
                content: reqRequest.content,
                username: user_name,
            });

            await request.save();


            // Lấy ra người dùng có id là user_id
            const user = await UserModel.findOne({ userId: req.body.user_id });

            if (!user) {
                return res.status(404).send('User not found');
            }

            await axios.delete(`${POST_URL}/${post_id}`, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`
                }
            });

            request.advice = request.advice.filter(advice => advice.username !== user_name);
            request.status = REQUEST_STATUS.SENT;

            await request.save();


            try {
                // Báo báo là bạn đã bình luận kiến nghị thành công
                const messageData = {
                    channel_id: channel_id,
                    message: `Bạn đã bình luận kiến nghị với mã **${request.code}**`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });

            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }

            try {
                const lstBot = await BotModel.find();
                const channel_id = lstBot[1].channelIds[0];

                const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');
                const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${(comment.content)} _(${comment.username})_` }).join('\n') : 'Chưa có bình luận';

                const messageData = {
                    channel_id: channel_id,
                    message: `Người dùng **${req.body.user_name || user.username}** đã bình luận kiến nghị với mã **${request.code}**`,
                    props: {
                        attachments: [
                            {
                                text: "## Thông tin kiến nghị",
                                fields: [
                                    { title: "Mã kiến nghị", value: request.code, short: true },
                                    { title: "Tiêu đề", value: request.title, short: true },
                                    { title: "Ngày tạo", value: formattedDate, short: true },
                                    { title: "Ngày nhận", value: request.receivedDate, short: true },
                                    { title: "Danh mục", value: request.category, short: true },
                                    { title: "Trạng thái", value: getStatus(request.status), short: true },
                                    { title: "Nội dung", value: request.content, short: false },
                                    { title: "Bình luận", value: commentContent, short: false },
                                ],
                                actions: [
                                    {
                                        name: 'Sửa kiến nghị',
                                        type: 'button',
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-edit-request/${request.code}`,
                                            context: {
                                                action: 'edit'
                                            }
                                        },
                                        style: 'primary',
                                    },
                                    {
                                        name: 'Loại bỏ kiến nghị',
                                        type: 'button',
                                        integration: {
                                            url: `${NGROK_URL}/api/request-mattermost/open-delete-request`,
                                            context: {
                                                action: 'delete'
                                            }
                                        },
                                        style: 'primary',
                                    },
                                ]
                            }
                        ]
                    }
                };

                const response = await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Message sent:', response.data);
                res.status(200).send();
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }

        }
        catch (error) {
            console.error('Error handling cancellation:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    } catch (error) {
        console.error('Error handling comment request:', error);
        return res.status(500).send('Internal Server Error');
    }
};

const handleSumaryRequest = async (req, res) => {
    // Thống kê số lượng kiến nghị đã được chấp nhận, số lượng kiến nghị loại bỏ và số lượng kiến nghị chưa được xử lý, cũng như ở cuối sẽ có 3 nút xem danh sách các kiến nghị trên

    try {
        const { channel_id, user_id } = req.body;
        console.log('Sumary request ', req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(user);

        if (!user) {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền xem tổng hợp kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (user && user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền xem tổng hợp kiến nghị`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        let lstRequest = await RequestModal.find();

        const numberRequestApproved = lstRequest.filter((request) => request.status === REQUEST_STATUS.APPROVED).length;

        const numberRequestRejected = lstRequest.filter((request) => request.status === REQUEST_STATUS.REJECTED).length;

        const numberRequestPending = lstRequest.filter((request) => request.status === REQUEST_STATUS.PENDING).length;

        const text = `- Số lượng kiến nghị đã chấp thuận: **${numberRequestApproved}**\n- Số lượng kiến nghị đã loại bỏ: **${numberRequestRejected}**\n- Số lượng kiến nghị chờ xử lý: **${numberRequestPending}**`;

        try {
            const messageData = {
                channel_id: channel_id,
                message: "",
                props: {
                    attachments: [
                        {
                            text: text,
                            title: 'Thống kê kiến nghị',
                            actions: [
                                {
                                    name: "Danh sách kiến nghị chấp nhận",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/view-table-approved-request`,
                                        context: {
                                            action: "view"
                                        }
                                    },
                                    style: "primary"
                                },
                                {
                                    name: "Danh sách kiến nghị loại bỏ",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/view-table-rejected-request`,
                                        context: {
                                            action: "view"
                                        }
                                    },
                                    style: "primary"
                                },
                                {
                                    name: "Danh sách kiến nghị chờ xử lý",
                                    type: "button",
                                    integration: {
                                        url: `${NGROK_URL}/api/request-mattermost/view-table-pending-request`,
                                        context: {
                                            action: "view"
                                        }
                                    },
                                    style: "primary"
                                }

                            ]
                        }
                    ]
                }
            };
            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });



            console.log('Message sent:', response.data);
            res.status(200).send();

        }
        catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();

    } catch (error) {
        console.error('Error handling sumary request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleViewTableApprovedRequest = async (req, res) => {
    try {
        const { channel_id, user_id } = req.body;
        console.log('View table approved request ', req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(user);

        if (!user) {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền xem danh sách kiến nghị đã chấp thuận`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (user && user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền xem danh sách kiến nghị đã chấp thuận`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        let lstRequest = await RequestModal.find();

        lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.APPROVED);

        if (lstRequest.length === 0) {
            try {
                const messageData = {
                    channel_id: channel_id,
                    message: `Không có kiến nghị nào đã được chấp thuận`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();

            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }
        }

        const tableTitle = "## Danh sách kiến nghị đã chấp thuận";

        const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

        const tableRows = lstRequest.map((request, index) => {
            const date = new Date(request.createdDate);
            const formattedDate = date.toLocaleDateString('vi-VN');
            const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
            return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
        });

        const table = [tableTitle, tableHeader, ...tableRows].join('\n');

        const messageData = {
            channel_id: channel_id,
            message: `Danh sách kiến nghị đã chấp thuận`,
            props: {
                attachments: [
                    {
                        text: table,
                        actions: [
                            {
                                name: "Xuất file",
                                type: "button",
                                integration: {
                                    url: `${NGROK_URL}/api/request-mattermost/send-approved-report-link`,
                                    context: {
                                        action: "view"
                                    }
                                },
                                style: "primary"
                            }
                        ]
                    }
                ]
            }
        };

        try {
            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Message sent:', response.data);

            res.status(200).send();

        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    }
    catch (error) {
        console.error('Error handling view table approved request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleViewTableRejectedRequest = async (req, res) => {
    try {
        const { channel_id, user_id } = req.body;
        console.log('View table approved request ', req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(user);

        if (!user) {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền xem danh sách kiến nghị đã loại bỏ`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (user && user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền xem danh sách kiến nghị đã loại bỏ`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        let lstRequest = await RequestModal.find();

        lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.REJECTED);

        if (lstRequest.length === 0) {
            try {
                const messageData = {
                    channel_id: channel_id,
                    message: `Không có kiến nghị nào đã loại bỏ`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();

            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }
        }

        const tableTitle = "## Danh sách kiến nghị đã loại bỏ";

        const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

        const tableRows = lstRequest.map((request, index) => {
            const date = new Date(request.createdDate);
            const formattedDate = date.toLocaleDateString('vi-VN');
            const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
            return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
        });

        const table = [tableTitle, tableHeader, ...tableRows].join('\n');

        const messageData = {
            channel_id: channel_id,
            message: `Danh sách kiến nghị đã loại bỏ`,
            props: {
                attachments: [
                    {
                        text: table,
                    }
                ]
            }
        };

        try {
            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Message sent:', response.data);

            res.status(200).send();

        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();
    }
    catch (error) {
        console.error('Error handling view table approved request:', error);
        return res.status(500).send('Internal Server Error');
    }
}

const handleViewTablePendingRequest = async (req, res) => {
    try {
        const { channel_id, user_id } = req.body;
        console.log('View table approved request ', req.body);

        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(user);

        if (!user) {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền xem danh sách kiến nghị chờ xử lý`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (user && user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name || user.username}** không có quyền xem danh sách kiến nghị chờ xử lý`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        let lstRequest = await RequestModal.find();

        lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.PENDING);

        if (lstRequest.length === 0) {
            try {
                const messageData = {
                    channel_id: channel_id,
                    message: `Không có kiến nghị nào chờ xử lý`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                        'Content-Type': 'application/json'
                    }
                });

                return res.status(200).send();

            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).send();
            }
        }

        const tableTitle = "## Danh sách kiến nghị chờ xử lý";

        const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Danh mục | Tình trạng | Bình luận |\n| --- | --- | --- | --- | --- | --- |`;

        const tableRows = lstRequest.map((request, index) => {
            const date = new Date(request.createdDate);
            const formattedDate = date.toLocaleDateString('vi-VN');
            const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
            return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
        });

        const table = [tableTitle, tableHeader, ...tableRows].join('\n');

        const messageData = {
            channel_id: channel_id,
            message: `Danh sách kiến nghị chờ xử lý`,
            props: {
                attachments: [
                    {
                        text: table,
                    }
                ]
            }
        };

        try {
            const response = await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Message sent:', response.data);

            res.status(200).send();

        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send();
        }

        return res.status(200).send();

    }
    catch (error) {
        console.error('Error handling view table approved request:', error);
        return res.status(500).send('Internal Server Error');
    }

}

const handleSendApproveLink = async (req, res) => {
    try {
        const { channel_id, user_id } = req.body;
        const lstBot = await BotModel.find();
        let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

        const user = await UserModel.findOne({ userId: req.body.user_id });
        console.log(user);

        if (!user) {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyền xem danh sách kiến nghị chờ xử lý`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (user && user.role !== 'nv') {
            const messageData = {
                channel_id: channel_id,
                message: `Người dùng **${req.body.user_name}** không có quyên xem danh sách kiến nghị chờ xử lý`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${access}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        const messageData = {
            channel_id: channel_id,
            message: `Link kiến nghị chờ xử lý: [Tải về](${NGROK_URL}/api/report)`,
        };

        await axios.post(MESSAGE_URL, messageData, {
            headers: {
                'Authorization': `Bearer ${access}`,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).send();

    }
    catch (error) {
        console.error('Error handling send approve link:', error);
        return res.status(500).send('Internal Server Error');
    }
}


module.exports = {
    handleOpenDialogRequest, // Add new request
    handleAddRequest,
    handleViewTableRequest, // View table request
    handleViewRequest, // View request
    handleRequestToEdit, // Edit request
    handleOpenEditRequest,
    handleEditRequest,
    handleOpenDeleteRequest, // Delete request
    handleDeleteRequest,
    handleCancelDeleteRequest,
    handleOpenConfirmDeleteRequest,
    handleConfirmDeleteRequest,
    handleSendListRequest,// Send list request
    handleCancelSendListRequest,
    handleConfirmSendListRequest,
    handleRequestToAdvice, // Request to advice
    handleOpenAdviceDialog,
    handleAdviceRequest,
    handleApproveRequest, // Approve request
    handleSelectRequestToComment, // Comment request
    handleOpenCommentRequest,
    handleCommentRequest,
    handleSumaryRequest, // Sumary request
    handleViewTableApprovedRequest,
    handleViewTableRejectedRequest,
    handleViewTablePendingRequest,
    handleSendApproveLink  // Send approve link
};