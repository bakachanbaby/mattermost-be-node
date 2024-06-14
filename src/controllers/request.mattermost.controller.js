
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
            return 'Đã gửi request';
        case REQUEST_STATUS.PENDING:
            return 'Đang chờ xử lý';
        case REQUEST_STATUS.WAITING:
            return 'Đang chờ ý kiến';
        case REQUEST_STATUS.APPROVED:
            return 'Đã xử lý';
        case REQUEST_STATUS.REJECTED:
            return 'Đã từ chối';
        default:
            return '';

    }
}

const handleOpenDialogRequest = async (req, res) => {
    const response_url = req.body.response_url;
    const trigger_id = req.body.trigger_id;
    const channel_id = req.body.channel_id;
    let post_id = req.body.post_id || '';
    // const post_id = req.body.post_id;

    // Lấy ra người dùng có id là user_id
    const user = await UserModel.findOne({ userId: req.body.user_id });
    console.log(req.body);
    if (!user) {
        // return res.status(404).send('User not found');
        const messageData = {
            channel_id: channel_id,
            message: `Người dùng **${req.body.user_name}** không có quyền thêm kiến nghị mới`,
        };

        await axios.post(MESSAGE_URL, messageData, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).send();
    }

    if (user.role !== 'nv') {
        const messageData = {
            channel_id: channel_id,
            message: `Người dùng **${user.username}** không có quyền thêm kiến nghị mới`,
        };

        await axios.post(MESSAGE_URL, messageData, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).send();
    }

    let lstCategory = await CategoryModal.find();
    lstCategory = lstCategory.map((item) => {
        return {
            text: item.description,
            value: item._id
        };
    });
    console.log(req.body);
    console.log(lstCategory);

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
                    "optional": false
                },
                {
                    "display_name": "Ngày nhận",
                    "name": "receivedDate",
                    "type": "text",
                    "subtype": "",
                    "default": "",
                    "placeholder": "Vui lòng nhập ngày nhận (ngày/tháng/năm)",
                    "help_text": "",
                    "optional": false,
                    "requiredText": "Vui lòng nhập tiêu đề"
                },
                {
                    "display_name": "Danh mục",
                    "name": "category",
                    "type": "select",
                    "placeholder": "Vui lòng chọn danh mục",
                    "options": lstCategory
                }
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
};

const handleAddRequest = async (req, res) => {
    const state = JSON.parse(req.body.state);
    const channel_id = state.channel_id;
    const post_id = state.post_id;
    const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
    console.log(state);
    console.log(req.body);
    try {

        const reqRequest = {
            title: req.body.submission.title,
            content: req.body.submission.content,
            receivedDate: req.body.submission.receivedDate,
            categoryId: req.body.submission.category,
        }

        console.log(reqRequest);

        if (!reqRequest.title || !reqRequest.content || !reqRequest.receivedDate || !reqRequest.categoryId) {
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
                        }
                    });
                }

                // await axios.delete(`${POST_URL}/${post_id}`, {
                //     headers: {
                //         'Authorization': `Bearer ${MATTERMOST_ACCESS}`
                //     }
                // });

                // Thông báo trên kênh chung với @admin
                // try {
                //     // Lấy ra user là admin với role là admin và channel_id là channel_id
                //     const admin = await UserModel.findOne({ role: 'admin', channel_id: channel_id });
                //     console.log('Admin', admin);

                //     // Tạo một tin nhắn
                //     const message = `@${admin.username} Đã nhận được kiến nghị mới, cần chờ phê duyệt`;

                //     // Gửi tin nhắn
                //     await axios.post(MESSAGE_URL, {
                //         channel_id: channel_id,
                //         message: message
                //     }, {
                //         headers: {
                //             'Authorization': 'Bearer ' + MATTERMOST_ACCESS,
                //         }
                //     });

                // } catch (error) {
                //     console.error('Error sending message:', error);
                // }

                // Thông báo trực tiếp cho admin
                // try {
                //     const admin = await UserModel.findOne({ role: 'admin', channel_id: channel_id });

                //     const getUserId = await axios.get(`${USER_URL}/bot_quanhuyen`, {
                //         headers: {
                //             'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                //             'Content-Type': 'application/json'
                //         }
                //     })
                //     const botId = getUserId.data.id;

                //     const directMessage = await axios.post(DIRECT_URL, [
                //         botId,
                //         admin.userId
                //     ], {
                //         headers: {
                //             'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                //             'Content-Type': 'application/json'
                //         }
                //     });

                //     const channelId = directMessage.data.id;

                //     const message = `Đã nhận được kiến nghị mới, mã kiến nghị: **${e.data.code}**`;
                //     const formattedDate = new Date(e.data.createdDate).toLocaleDateString('vi-VN');

                //     await axios.post(MESSAGE_URL, {
                //         channel_id: channelId,
                //         message: message,
                //         props: {
                //             attachments: [
                //                 {
                //                     text: `#### Thông tin kiến nghị mới`,
                //                     fields: [
                //                         { title: "Mã kiến nghị", value: e.data.code, short: true },
                //                         { title: "Tiêu đề", value: e.data.title, short: true },
                //                         { title: "Nội dung", value: e.data.content, short: true },
                //                         { title: "Ngày tạo", value: formattedDate, short: true },
                //                         { title: "Lĩnh vực", value: e.data.category.description, short: true },
                //                         { title: "Trạng thái", value: e.data.status, short: true },
                //                     ],
                //                     actions: [
                //                         {
                //                             name: "Phê duyệt",
                //                             type: "button",
                //                             integration: {
                //                                 url: `${NGROK_URL}/api/request-mattermost/open-advice-dialog/${e.data._id}`,
                //                                 context: {
                //                                     action: "approve"
                //                                 }
                //                             },
                //                             style: "primary"
                //                         },
                //                         {
                //                             name: "Bình luận",
                //                             type: "button",
                //                             integration: {
                //                                 url: `${NGROK_URL}/api/request-mattermost/open-comment-request/${e.data._id}`,
                //                                 context: {
                //                                     action: "comment"
                //                                 }
                //                             },
                //                             style: "danger"
                //                         }
                //                     ]
                //                 }
                //             ]
                //         }
                //     }, {
                //         headers: {
                //             'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                //             'Content-Type': 'application/json'
                //         }
                //     });

                // } catch (error) {
                //     console.error('Error sending message:', error);
                // }

                // Hiển thị danh sách kiến nghị mới
                try {
                    const tableTitle = "## Danh sách kiến nghị";
                    const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

                    const tableRows = lstRequest.map((request, index) => {
                        const date = new Date(request.createdDate);
                        const receivedDate = new Date(request.receivedDate);
                        const formattedDate = date.toLocaleDateString('vi-VN');
                        const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                        return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category.description} | ${getStatus(request.status)} |`;
                    });
                    const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                    const messageData = {
                        channel_id: channel_id,
                        message: `Người dùng **${user.username}** đã thêm kiến nghị mới với mã **${e.data.code}**`,
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
                                        }
                                    ]
                                }
                            ]
                        }
                    };
                    const response = await axios.post(MESSAGE_URL, messageData, {
                        headers: {
                            'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
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
}

const handleViewTableRequest = async (req, res) => {
    const { channel_id } = req.body;
    const lstBot = await BotModel.find();

    console.log(lstBot);

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
            const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

            const tableRows = lstRequest.map((request, index) => {
                const date = new Date(request.createdDate);
                const receivedDate = new Date(request.receivedDate);
                const formattedDate = date.toLocaleDateString('vi-VN');
                const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category.description} | ${getStatus(request.status)} |`;
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

            try {
                const response = await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
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
            const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

            const tableRows = lstRequest.map((request, index) => {
                const date = new Date(request.createdDate);
                const receivedDate = new Date(request.receivedDate);
                const formattedDate = date.toLocaleDateString('vi-VN');
                const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category.description} | ${getStatus(request.status)} |`;
            });
            const table = [tableTitle, tableHeader, ...tableRows].join('\n');

            const messageData = {
                channel_id: channel_id,
                message: "Dưới đây là bảng thông tin kiến nghị:",
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

    res.status(200).send();
};

const handleViewRequest = async (req, res) => {
    const { channel_id, text } = req.body;
    console.log(req.body);

    const lstBot = await BotModel.find();

    if (lstBot[0].channelIds[0] === channel_id) {
        // Lấy ra kiến nghị có code là text
        const request = await RequestModal.findOne({ code: text });
        console.log(request);

        if (!request) {
            const messageData = {
                channel_id: channel_id,
                message: `Không tìm thấy kiến nghị với mã **${text}**`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (request.status === REQUEST_STATUS.SENT) {
            const messageData = {
                channel_id: channel_id,
                message: `Kiến nghị mã **${request.code}** đã được gửi, không thể xem`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

        const fields = [
            { title: "Mã kiến nghị", value: text, short: true },
            { title: "Tiêu đề", value: request.title, short: true },
            { title: "Nội dung", value: request.content, short: true },
            { title: "Ngày tạo", value: formattedDate, short: true },
            { title: "Lĩnh vực", value: request.category.description, short: true },
            { title: "Trạng thái", value: getStatus(request.status), short: true },
        ]

        if (request.comments && request.comments.content) {
            fields.push({ title: "Bình luận", value: request.comments.content, short: false });
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
                                name: "Xóa kiến nghị",
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
        // Lấy ra kiến nghị có code là text
        const request = await RequestModal.findOne({ code: text });
        console.log(request);

        if (!request) {
            const messageData = {
                channel_id: channel_id,
                message: `Không tìm thấy kiến nghị với mã **${text}**`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }

        if (request.status === REQUEST_STATUS.IDLE) {
            const messageData = {
                channel_id: channel_id,
                message: `Kiến nghị mã **${request.code}** chưa được gửi, không thể xem`,
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
            { title: "Nội dung", value: request.content, short: true },
            { title: "Ngày tạo", value: formattedDate, short: true },
            { title: "Lĩnh vực", value: request.category.description, short: true },
            { title: "Trạng thái", value: getStatus(request.status), short: true },
        ]

        if (request.comments && request.comments.content) {
            fields.push({ title: "Bình luận", value: request.comments.content, short: false });
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
                                name: "Xóa kiến nghị",
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


}

const handleSendListRequest = async (req, res) => {
    console.log('Send list request');
    const { channel_id, team_id } = req.body;
    console.log(req.body);

    const lstBot = await BotModel.find();

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
                    'Content-Type': 'application/json'
                }
            });

            const bots = await axios.get(BOTS_URL,
                {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                        'Content-Type': 'application/json'
                    }
                });

            console.log('Bots:', bots.data);

            // Lấy ra channel id của kênh "Phòng dân quyền UBND Thành Phố"

            const channel = await axios.get(`${TEAM_URL}/${team_id}/channels/name/phong-dan-nguyen-ubnd-thanh-pho`, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json'
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
            const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

            const tableRows = lstRequest.map((request, index) => {
                const date = new Date(request.createdDate);
                const receivedDate = new Date(request.receivedDate);
                const formattedDate = date.toLocaleDateString('vi-VN');
                const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category.description} | ${getStatus(request.status)} |`;
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
        const text = req.body.text || req.params.code;
        console.log(req.body);
        let flat = true;
        // Thông báo trên kênh chung với @admin
        const lstRequest = text.split(', ');
        const lstRequestSystem = await RequestModal.find();

        lstRequest.forEach(async (code) => {
            const request = lstRequestSystem.find((item) => item.code === code);
            if (!request || request.status !== REQUEST_STATUS.SENT) {
                flat = false;
                const messageData = {
                    channel_id: channel_id,
                    message: `Không tìm thấy kiến nghị với mã **${code}**`,
                };

                await axios.post(MESSAGE_URL, messageData, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        });
        console.log(flat);
        if (!flat) {
            return res.status(200).send();
        }
        else {
            try {
                // Lấy ra user là admin với role là admin và channel_id là channel_id
                const admin = await UserModel.findOne({ role: 'admin', channelId: channel_id });
                console.log('Admin', admin);

                // Tạo một tin nhắn
                const message = `@${admin.username} người dùng **${req.body.user_name}** đã gửi danh sách kiến nghị với mã **${text}**`;

                // Gửi tin nhắn
                await axios.post(MESSAGE_URL, {
                    channel_id: channel_id,
                    message: message
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + MATTERMOST_ACCESS_BOT_TP,
                    }
                });

            } catch (error) {
                console.error('Error sending message:', error);
            }

            // Gán trạng thái của các kiến nghị đã gửi thành REQUEST_STATUS.PENDING
            lstRequest.forEach(async (code) => {
                const request = lstRequestSystem.find((item) => item.code === code);
                request.status = REQUEST_STATUS.PENDING;
                await request.save();
            });

            // Thông báo trực tiếp cho admin

            lstRequest.forEach(async (code) => {
                try {
                    const request = lstRequestSystem.find((item) => item.code === code);
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

                    const message = `Đã nhận được kiến nghị mới, mã kiến nghị: **${request.code}**`;
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
                                        { title: "Nội dung", value: request.content, short: true },
                                        { title: "Ngày tạo", value: formattedDate, short: true },
                                        { title: "Ngày nhận", value: request.receivedDate, short: true },
                                        { title: "Lĩnh vực", value: request.category.description, short: true },
                                        { title: "Trạng thái", value: getStatus(request.status), short: true },
                                    ],
                                    actions: [
                                        {
                                            name: "Xin ý kiến",
                                            type: "button",
                                            integration: {
                                                url: `${NGROK_URL}/api/request-mattermost/open-advice-dialog/${request._id}`,
                                                context: {
                                                    action: "approve"
                                                }
                                            },
                                            style: "primary"
                                        },
                                        // {
                                        //     name: "Bình luận",
                                        //     type: "button",
                                        //     integration: {
                                        //         url: `${NGROK_URL}/api/request-mattermost/open-comment-request/${request._id}`,
                                        //         context: {
                                        //             action: "comment"
                                        //         }
                                        //     },
                                        //     style: "danger"
                                        // }
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

                    res.status(200).send();

                } catch (error) {
                    console.error('Error sending message:', error);
                    res.status(500).send();
                }
            });
        }


    }


};

const handleOpenEditRequest = async (req, res) => {
    const response_url = req.body.response_url;
    const trigger_id = req.body.trigger_id;
    const channel_id = req.body.channel_id;

    const lstBot = await BotModel.find();
    let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

    console.log('Open edit request', req.body);
    let text = req.body.text || req.params.code;
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
            message: `Người dùng **${user.username}** không có quyền sửa kiến nghị`,
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
        if (request && request.status === REQUEST_STATUS.SENT) {
            const messageData = {
                channel_id: channel_id,
                message: `Kiến nghị mã **${request.code}** đã được gửi, không thể sửa`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }
    }

    else if (lstBot[1].channelIds[0] === channel_id) {
        if (request && request.status === REQUEST_STATUS.IDLE) {
            const messageData = {
                channel_id: channel_id,
                message: `Kiến nghị mã **${request.code}** chưa được gửi, không thể sửa`,
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
        const messageData = {
            channel_id: channel_id,
            message: `Không tìm thấy kiến nghị với mã **${text}**`,
        };

        await axios.post(MESSAGE_URL, messageData, {
            headers: {
                'Authorization': `Bearer ${access}`,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).send();
    }

    let lstCategory = await CategoryModal.find();
    lstCategory = lstCategory.map((item) => {
        return {
            text: item.description,
            value: item._id
        };
    });
    console.log(req.body);
    console.log(lstCategory);

    console.log(response_url, trigger_id, channel_id);

    console.log(request);
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
                    "optional": false
                },
                {
                    "display_name": "Ngày nhận",
                    "name": "receivedDate",
                    "type": "text",
                    "subtype": "",
                    "default": request.receivedDate,
                    "placeholder": "Vui lòng nhập ngày nhận (ngày/tháng/năm)",
                    "help_text": "",
                    "optional": false,
                },
                {
                    "display_name": "Danh mục",
                    "name": "category",
                    "type": "select",
                    "placeholder": "Vui lòng chọn danh mục",
                    "default": request.category._id,
                    "options": lstCategory
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
};

const handleEditRequest = async (req, res) => {
    const state = JSON.parse(req.body.state);
    const channel_id = state.channel_id;
    const post_id = state.post_id;
    const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
    console.log('Edit request');
    console.log(state);
    console.log(req.body);

    const lstBot = await BotModel.find();

    let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

    try {

        const reqRequest = {
            title: req.body.submission.title,
            content: req.body.submission.content,
            receivedDate: req.body.submission.receivedDate,
            categoryId: req.body.submission.category,
        }

        console.log('Edit request ', reqRequest);

        if (!reqRequest.title || !reqRequest.content || !reqRequest.receivedDate || !reqRequest.categoryId) {
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

                if (lstBot[0].channelIds[0] === channel_id)
                    lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);
                else if (lstBot[1].channelIds[0] === channel_id)
                    lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.SENT);


                console.log(lstRequest);


                if (post_id) {
                    await axios.delete(`${POST_URL}/${post_id}`, {
                        headers: {
                            'Authorization': `Bearer ${access}`
                        }
                    });

                }

                // // Thông báo trên kênh chung với @admin
                // try {
                //     // Lấy ra user là admin với role là admin và channel_id là channel_id
                //     const admin = await UserModel.findOne({ role: 'admin', channel_id: channel_id });
                //     console.log('Admin', admin);

                //     // Tạo một tin nhắn
                //     const message = `@${admin.username} Đã nhận được kiến nghị vừa sửa mới, cần chờ phê duyệt`;

                //     // Gửi tin nhắn
                //     await axios.post(MESSAGE_URL, {
                //         channel_id: channel_id,
                //         message: message
                //     }, {
                //         headers: {
                //             'Authorization': 'Bearer ' + MATTERMOST_ACCESS,
                //         }
                //     });

                // } catch (error) {
                //     console.error('Error sending message:', error);
                // }

                // // Thông báo trực tiếp cho admin
                // try {
                //     const admin = await UserModel.findOne({ role: 'admin', channel_id: channel_id });

                //     const getUserId = await axios.get(`${USER_URL}/bot_quanhuyen`, {
                //         headers: {
                //             'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                //             'Content-Type': 'application/json'
                //         }
                //     })
                //     const botId = getUserId.data.id;

                //     const directMessage = await axios.post(DIRECT_URL, [
                //         botId,
                //         admin.userId
                //     ], {
                //         headers: {
                //             'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                //             'Content-Type': 'application/json'
                //         }
                //     });

                //     const channelId = directMessage.data.id;

                //     const message = `Đã có kiến nghị mới được sửa, mã kiến nghị: **${e.data.code}**`;
                //     const formattedDate = new Date(e.data.createdDate).toLocaleDateString('vi-VN');
                //     const formattedReceivedDate = new Date(e.data.receivedDate).toLocaleDateString('vi-VN');

                //     await axios.post(MESSAGE_URL, {
                //         channel_id: channelId,
                //         message: message,
                //         props: {
                //             attachments: [
                //                 {
                //                     text: `#### Thông tin kiến nghị mới được sửa`,
                //                     fields: [
                //                         { title: "Mã kiến nghị", value: e.data.code, short: true },
                //                         { title: "Tiêu đề", value: e.data.title, short: true },
                //                         { title: "Nội dung", value: e.data.content, short: true },
                //                         { title: "Ngày tạo", value: formattedDate, short: true },
                //                         { title: "Ngày nhận", value: formattedReceivedDate, short: true },
                //                         { title: "Lĩnh vực", value: e.data.category.description, short: true },
                //                         { title: "Trạng thái", value: e.data.status, short: true },
                //                     ],
                //                     actions: [
                //                         {
                //                             name: "Phê duyệt",
                //                             type: "button",
                //                             integration: {
                //                                 url: `${NGROK_URL}/api/request-mattermost/open-advice-dialog/${e.data._id}`,
                //                                 context: {
                //                                     action: "approve"
                //                                 }
                //                             },
                //                             style: "primary"
                //                         },
                //                         {
                //                             name: "Bình luận",
                //                             type: "button",
                //                             integration: {
                //                                 url: `${NGROK_URL}/api/request-mattermost/open-comment-request/${e.data._id}`,
                //                                 context: {
                //                                     action: "comment"
                //                                 }
                //                             },
                //                             style: "danger"
                //                         }
                //                     ]
                //                 }
                //             ]
                //         }
                //     }, {
                //         headers: {
                //             'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                //             'Content-Type': 'application/json'
                //         }
                //     });

                // } catch (error) {
                //     console.error('Error sending message:', error);
                // }

                // Hiển thị danh sách kiến nghị 
                try {
                    const tableTitle = "## Danh sách kiến nghị";
                    const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

                    const tableRows = lstRequest.map((request, index) => {
                        const date = new Date(request.createdDate);
                        const receivedDate = new Date(request.receivedDate);
                        const formattedDate = date.toLocaleDateString('vi-VN');
                        const formattedReceivedDate = receivedDate.toLocaleDateString('vi-VN');
                        return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category.description} | ${getStatus(request.status)} |`;
                    });
                    const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                    const messageData = {
                        channel_id: channel_id,
                        message: `Người dùng **${user.username}** đã sửa kiến nghị với mã **${e.data.code}**`,
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
                                        }
                                    ],
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
}

const handleDeleteRequest = async (req, res) => {
    const { channel_id } = req.body;
    let text = req.body.text || req.params.code;
    let post_id = req.body.post_id || '';
    console.log(req.body);

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
            message: `Người dùng **${user.username}** không có quyền sửa kiến nghị`,
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
        if (request && request.status === REQUEST_STATUS.SENT) {
            const messageData = {
                channel_id: channel_id,
                message: `Kiến nghị mã **${request.code}** đã được gửi, không thể xóa`,
            };

            await axios.post(MESSAGE_URL, messageData, {
                headers: {
                    'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).send();
        }
    }

    else if (lstBot[1].channelIds[0] === channel_id) {
        if (request && request.status === REQUEST_STATUS.IDLE) {
            const messageData = {
                channel_id: channel_id,
                message: `Kiến nghị mã **${request.code}** chưa được gửi, không thể xóa`,
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
                'Content-Type': 'application/json'
            }
        });
    }

    try {
        const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');
        const formattedReceivedDate = new Date(request.receivedDate).toLocaleDateString('vi-VN');

        const messageData = {
            channel_id: channel_id,
            message: "",
            props: {
                attachments: [
                    {
                        text: "### Bạn có thật sự muốn xóa kiến nghị này?",
                        fields: [
                            { title: "Mã kiến nghị", value: text, short: true },
                            { title: "Tiêu đề", value: request.title, short: true },
                            { title: "Nội dung", value: request.content, short: true },
                            { title: "Ngày tạo", value: formattedDate, short: true },
                            { title: "Ngày nhận", value: formattedReceivedDate, short: true },
                            { title: "Lĩnh vực", value: request.category.description, short: true },
                            { title: "Trạng thái", value: getStatus(request.status), short: true },
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
                                name: "Xóa",
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
};

const handleCancelDeleteRequest = async (req, res) => {
    const { post_id, user_name } = req.body;
    const channel_id = req.body.channel_id;

    const lstBot = await BotModel.find();
    let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

    console.log(req.body);
    try {
        await axios.delete(`${POST_URL}/${post_id}`, {
            headers: {
                'Authorization': `Bearer ${access}`
            }
        });
    }
    catch (error) {
        console.error('Error sending message:', error);
    }
}

const handleConfirmDeleteRequest = async (req, res) => {
    // const state = JSON.parse(req.body.state);
    const channel_id = req.body.channel_id;
    const { post_id, user_name } = req.body;
    const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
    console.log('Delete request');
    console.log(req.body);

    const lstBot = await BotModel.find();
    let access = channel_id === lstBot[0].channelIds[0] ? MATTERMOST_ACCESS : MATTERMOST_ACCESS_BOT_TP;

    try {
        await axios.delete(`${urlAddRequest}/${req.params.id}`)
            .then(async (e) => {
                console.log(e.data);

                await axios.delete(`${POST_URL}/${post_id}`, {
                    headers: {
                        'Authorization': `Bearer ${access}`
                    }
                });

                // Lấy ra người dùng có id là user_id
                const user = await UserModel.findOne({ userId: req.body.user_id });

                if (!user) {
                    return res.status(404).send('User not found');
                }

                let lstRequest = await RequestModal.find();

                if (lstBot[0].channelIds[0] === channel_id)
                    lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.IDLE);
                else if (lstBot[1].channelIds[0] === channel_id)
                    lstRequest = lstRequest.filter((request) => request.status === REQUEST_STATUS.SENT);

                console.log(lstRequest);

                const tableTitle = "## Danh sách kiến nghị";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Ngày nhận | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

                const tableRows = lstRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} ${request.category.description} | ${getStatus(request.status)} |`;
                });
                const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                const messageData = {
                    channel_id: channel_id,
                    message: `Người dùng **${user.username}** đã xóa kiến nghị với mã **${e.data.request.code}**`,
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
                                    }
                                ],
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

            })
            .catch(err => {
                console.error(err);
            });

    } catch (error) {
        console.error('Error handling cancellation:', error);
        res.status(500).send();
    }
}

const handleOpenAdviceDialog = async (req, res) => {
    const { post_id, user_name, trigger_id, channel_id } = req.body;
    console.log(req.body);
    console.log(req.params);
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
            url: `${NGROK_URL}/api/request-mattermost/advice-request/${req.params.id}`,
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
}

const handleAdviceRequest = async (req, res) => {
    const state = JSON.parse(req.body.state);
    const channel_id = state.channel_id;
    const post_id = state.post_id;
    console.log('Advice request');
    console.log(state);
    console.log(req.body);

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

        // Xóa đi post hiện tại
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
                            { title: "Nội dung", value: request.content, short: true },
                            { title: "Ngày tạo", value: formattedDate, short: true },
                            { title: "Ngày nhận", value: request.receivedDate, short: true },
                            { title: "Lĩnh vực", value: request.category.description, short: true },
                            { title: "Trạng thái", value: getStatus(request.status), short: true },
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

        res.status(200).send();



    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send();
    }
}

const handleApproveRequest = async (req, res) => {
    const request = await RequestModal.findOne({ _id: req.params.id });

    if (!request) {
        return res.status(404).send('Request not found');
    }

    console.log(request);

    // Thay đổi trạng thái của kiến nghị
    request.status = REQUEST_STATUS.APPROVED;
    await request.save();

    console.log('Approve request', req.body);
    const lstBot = await BotModel.find();

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

    // Xóa đi post hiện tại

    await axios.delete(`${POST_URL}/${req.body.post_id}`, {
        headers: {
            'Authorization': `Bearer ${MATTERMOST_ACCESS_BOT_TP}`
        }
    });

    const channel_id = lstBot[1].channelIds[0];

    const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

    const messageData = {
        channel_id: channel_id,
        message: `Người dùng **${user.username}** đã chấp thuận kiến nghị với mã **${request.code}**`,
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
                        { title: "Nội dung", value: request.content, short: true },
                        { title: "Ngày tạo", value: formattedDate, short: true },
                        { title: "Ngày nhận", value: request.receivedDate, short: true },
                        { title: "Lĩnh vực", value: request.category.description, short: true },
                        { title: "Trạng thái", value: getStatus(request.status), short: true },
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

    res.status(200).send();

    res.status(200).send();
}


const handleOpenCommentRequest = async (req, res) => {
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
                    "optional": false
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
}

const handleCommentRequest = async (req, res) => {
    const state = JSON.parse(req.body.state);
    const channel_id = state.channel_id;
    const post_id = state.post_id;
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

        await axios.put(`${urlAddRequest}/${req.params.id}/comment`, reqRequest)
            .then(async (e) => {
                console.log(e.data);

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

                try {
                    const user = await UserModel.findOne({ userId: req.body.user_id });
                    const channel_id = user.channelId;

                    const formattedDate = new Date(e.data.createdDate).toLocaleDateString('vi-VN');

                    const messageData = {
                        channel_id: channel_id,
                        message: "Người dùng **" + user.username + "** đã bình luận kiến nghị với mã **" + e.data.code + "**",
                        props: {
                            attachments: [
                                {
                                    text: "## Thông tin kiến nghị",
                                    fields: [
                                        { title: "Mã kiến nghị", value: e.data.code, short: true },
                                        { title: "Tiêu đề", value: e.data.title, short: true },
                                        { title: "Nội dung", value: e.data.content, short: true },
                                        { title: "Ngày tạo", value: formattedDate, short: true },
                                        { title: "Lĩnh vực", value: e.data.category.description, short: true },
                                        { title: "Trạng thái", value: e.data.status, short: true },
                                        { title: "Bình luận", value: e.data.comments.content, short: false },
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
            })
            .catch(err => {
                console.error(err);
            });
    }
    catch (error) {
        console.error('Error handling cancellation:', error);
        res.status(500).send();
    }

};

module.exports = {
    handleOpenDialogRequest,
    handleAddRequest,
    handleViewTableRequest,
    handleViewRequest,
    handleOpenEditRequest,
    handleEditRequest,
    handleDeleteRequest,
    handleCancelDeleteRequest,
    handleConfirmDeleteRequest,
    handleOpenAdviceDialog,
    handleOpenCommentRequest,
    handleCommentRequest,
    handleSendListRequest,
    handleAdviceRequest,
    handleApproveRequest,
};