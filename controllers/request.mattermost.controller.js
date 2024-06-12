
require('dotenv').config();

const axios = require('axios');
const Category = require('../models/category.modal');
const UserModel = require('../models/user.model');
const RequestModal = require('../models/request.model');
const DIALOG_URL = `${process.env.URL_MATTERMOST}/api/v4/actions/dialogs/open`;
const MESSAGE_URL = `${process.env.URL_MATTERMOST}/api/v4/posts`;
const MATTERMOST_ACCESS = process.env.MATTERMOST_ACCESS_TOKEN;
const NGROK_URL = process.env.URL_NGROK;
const POST_URL = `${process.env.URL_MATTERMOST}/api/v4/posts`;

const handleOpenDialogRequest = async (req, res) => {
    const response_url = req.body.response_url;
    const trigger_id = req.body.trigger_id;
    const channel_id = req.body.channel_id;

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

    let lstCategory = await Category.find();
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
                    requiredText: "Vui lòng nhập tiêu đề"
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
                    "display_name": "Độ ưu tiên",
                    "name": "priority",
                    "type": "select",
                    "placeholder": "Vui lòng chọn độ ưu tiên",
                    "options": [
                        {
                            "text": "1",
                            "value": "1"
                        },
                        {
                            "text": "2",
                            "value": "2"
                        },
                        {
                            "text": "3",
                            "value": "3"
                        }
                    ]
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
            state: JSON.stringify({ response_url, channel_id, trigger_id })
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
    const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
    console.log(state);
    console.log(req.body);
    try {

        const reqRequest = {
            title: req.body.submission.title,
            content: req.body.submission.content,
            priority: req.body.submission.priority,
            categoryId: req.body.submission.category,
        }

        console.log(reqRequest);

        if (!reqRequest.title || !reqRequest.content || !reqRequest.priority || !reqRequest.categoryId) {
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

                const lstRequest = await RequestModal.find();
                console.log(lstRequest);

                const tableTitle = "## Danh sách kiến nghị";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

                const tableRows = lstRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.category.description} | ${request.status} |`;
                });
                const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                const messageData = {
                    channel_id: channel_id,
                    message: `Người dùng **${user.username}** đã thêm kiến nghị mới với mã **${e.data.code}**`,
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

    const lstRequest = await RequestModal.find();
    console.log(lstRequest);

    const tableTitle = "## Danh sách kiến nghị";
    const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

    const tableRows = lstRequest.map((request, index) => {
        const date = new Date(request.createdDate);
        const formattedDate = date.toLocaleDateString('vi-VN');
        return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.category.description} | ${request.status} |`;
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
};

const handleViewRequest = async (req, res) => {
    const { channel_id, text } = req.body;
    console.log(req.body);

    // Lấy ra kiến nghị có code là text
    const request = await RequestModal.findOne({ code: text });
    console.log(request);

    const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

    const messageData = {
        channel_id: channel_id,
        message: "Dưới đây là thông tin kiến nghị:",
        props: {
            attachments: [
                {
                    text: "## Thông tin kiến nghị",
                    fields: [
                        { title: "Mã kiến nghị", value: text, short: true },
                        { title: "Tiêu đề", value: request.title, short: true },
                        { title: "Nội dung", value: request.content, short: true },
                        { title: "Ngày tạo", value: formattedDate, short: true },
                        { title: "Lĩnh vực", value: request.category.description, short: true },
                        { title: "Trạng thái", value: request.status, short: true },
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

const handleOpenEditRequest = async (req, res) => {
    const response_url = req.body.response_url;
    const trigger_id = req.body.trigger_id;
    const channel_id = req.body.channel_id;
    const text = req.body.text;

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
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).send();
    }

    if (user.role !== 'nv') {
        const messageData = {
            channel_id: channel_id,
            message: `Người dùng **${user.username}** không có quyền sửa kiến nghị`,
        };

        await axios.post(MESSAGE_URL, messageData, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).send();
    }

    let lstCategory = await Category.find();
    lstCategory = lstCategory.map((item) => {
        return {
            text: item.description,
            value: item._id
        };
    });
    console.log(req.body);
    console.log(lstCategory);

    console.log(response_url, trigger_id, channel_id);

    const request = await RequestModal.findOne({ code: text });
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
                    "display_name": "Độ ưu tiên",
                    "name": "priority",
                    "type": "select",
                    "placeholder": "Vui lòng chọn độ ưu tiên",
                    "default": request.priority.toString(),
                    "options": [
                        {
                            "text": "1",
                            "value": "1"
                        },
                        {
                            "text": "2",
                            "value": "2"
                        },
                        {
                            "text": "3",
                            "value": "3"
                        }
                    ]
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
            state: JSON.stringify({ response_url, channel_id, trigger_id })
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

const handleEditRequest = async (req, res) => {
    const state = JSON.parse(req.body.state);
    const channel_id = state.channel_id;
    const urlAddRequest = `${process.env.URL_NGROK}/api/request`;
    console.log('Edit request');
    console.log(state);
    console.log(req.body);
    try {

        const reqRequest = {
            title: req.body.submission.title,
            content: req.body.submission.content,
            priority: req.body.submission.priority,
            categoryId: req.body.submission.category,
        }

        console.log('Edit request ', reqRequest);

        if (!reqRequest.title || !reqRequest.content || !reqRequest.priority || !reqRequest.categoryId) {
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

                const lstRequest = await RequestModal.find();
                console.log(lstRequest);

                const tableTitle = "## Danh sách kiến nghị";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

                const tableRows = lstRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.category.description} | ${request.status} |`;
                });
                const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                const messageData = {
                    channel_id: channel_id,
                    message: `Người dùng **${user.username}** đã sửa kiến nghị với mã **${e.data.code}**`,
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

const handleDeleteRequest = async (req, res) => {
    const { channel_id, text } = req.body;
    console.log(req.body);

    // Lấy ra kiến nghị có code là text
    const request = await RequestModal.findOne({ code: text });
    console.log(request);

    const formattedDate = new Date(request.createdDate).toLocaleDateString('vi-VN');

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
                        { title: "Lĩnh vực", value: request.category.description, short: true },
                        { title: "Trạng thái", value: request.status, short: true },
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
};

const handleCancelDeleteRequest = async (req, res) => {
    const { post_id, user_name } = req.body;
    console.log(req.body);
    try {
        await axios.delete(`${POST_URL}/${post_id}`, {
            headers: {
                'Authorization': `Bearer ${MATTERMOST_ACCESS}`
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
    try {
        await axios.delete(`${urlAddRequest}/${req.params.id}`)
            .then(async (e) => {
                console.log(e.data);

                await axios.delete(`${POST_URL}/${post_id}`, {
                    headers: {
                        'Authorization': `Bearer ${MATTERMOST_ACCESS}`
                    }
                });

                // Lấy ra người dùng có id là user_id
                const user = await UserModel.findOne({ userId: req.body.user_id });

                if (!user) {
                    return res.status(404).send('User not found');
                }

                const lstRequest = await RequestModal.find();
                console.log(lstRequest);

                const tableTitle = "## Danh sách kiến nghị";
                const tableHeader = `| STT | Mã kiến nghị | Tiêu đề | Nội dung | Ngày tạo | Lĩnh vực | Tình trạng |\n| --- | --- | --- | --- | --- | --- |`;

                const tableRows = lstRequest.map((request, index) => {
                    const date = new Date(request.createdDate);
                    const formattedDate = date.toLocaleDateString('vi-VN');
                    return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.category.description} | ${request.status} |`;
                });
                const table = [tableTitle, tableHeader, ...tableRows].join('\n');

                const messageData = {
                    channel_id: channel_id,
                    message: `Người dùng **${user.username}** đã xóa kiến nghị với mã **${e.data.request.code}**`,
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
};