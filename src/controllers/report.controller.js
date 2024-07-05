const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Category = require('../models/category.modal');
const { type } = require('os');
const { REQUEST_STATUS } = require('../enums/define');
const Request = require('../models/request.model');

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
const replaceText = (text) => {
    // Kiểu tra nếu text có \n, | thì thay thế bằng dấu cách
    let newText = text.replace(/\n/g, ' ');
    newText = newText.replace(/\|/g, '-');
    return newText;
}

const handleExportExcel = async (req, res) => {
    try {
        console.log('Export excel', req.url);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet1');

        const borderStyle = {
            top: { style: 'thick' },
            left: { style: 'thick' },
            bottom: { style: 'thick' },
            right: { style: 'thick' }
        };

        const evenRowFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF' }
        };

        const oddRowFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'f1f2f3' }
        };
        sheet.columns = [
            { header: 'STT', key: 'stt', width: 5, style: { alignment: { wrapText: true, vertical: 'middle' } } }, // Ứớc lượng 50px
            { header: 'Mã kiến nghị', key: 'code', width: 15, style: { alignment: { wrapText: true, vertical: 'middle' } } }, // Ứớc lượng 100px
            { header: 'Tiêu đề', key: 'title', width: 30, style: { alignment: { wrapText: true, vertical: 'middle' } } }, // Ứớc lượng 500px
            { header: 'Nội dung', key: 'content', width: 100, style: { alignment: { wrapText: true, vertical: 'middle' } } }, // Chỉnh sửa theo nhu cầu
            { header: 'Ngày tạo', key: 'createdDate', width: 20, style: { alignment: { wrapText: true, vertical: 'middle' } } },
            { header: 'Ngày nhập', key: 'receivedDate', width: 20, style: { alignment: { wrapText: true, vertical: 'middle' } } },
            { header: 'Danh mục', key: 'category', width: 20, style: { alignment: { wrapText: true, vertical: 'middle' } } },
            { header: 'Tình trạng', key: 'status', width: 20, style: { alignment: { wrapText: true, vertical: 'middle' } } },
            { header: 'Bình luận', key: 'comments', width: 100, style: { alignment: { wrapText: true, vertical: 'middle' } } },
        ];

        let requests = [];
        let fileName = 'f';
        if(req.url === '/1') {
            requests = await Request.find({
                status: REQUEST_STATUS.APPROVED
            });
            fileName = 'Danh sách kiến nghị đã chấp nhận.xlsx';

        }

        else if(req.url === '/2') {
            requests = await Request.find({
                status: REQUEST_STATUS.REJECTED
            });
            fileName = 'Danh sách kiến nghị đã từ chối.xlsx';
        }

        else if(req.url === '/3') {
            requests = await Request.find({
                status: REQUEST_STATUS.PENDING
            });
            fileName = 'Danh sách kiến nghị đang chờ xử lý.xlsx';
        }
       
        // Định nghĩa style cho header
        sheet.getRow(1).font = { bold: true };
        // const tableRows = lstRequest.map((request, index) => {
        //     const date = new Date(request.createdDate);
        //     const formattedDate = date.toLocaleDateString('vi-VN');
        //     const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
        //     return `| ${index + 1} | ${request.code} | ${request.title} | ${request.content} | ${formattedDate} | ${request.receivedDate} | ${request.category} | ${getStatus(request.status)} | ${commentContent} |`;
        // });

        requests.forEach((request) => {
            const date = new Date(request.createdDate);
            const formattedDate = date.toLocaleDateString('vi-VN');
            const commentContent = (request.comments || request.comments.length > 0) ? request.comments.map((comment) => { return `${replaceText(comment.content)} _(${comment.username})_` }).join('. ') : 'Chưa có bình luận';
            sheet.addRow({
                stt: requests.indexOf(request) + 1,
                code: request.code,
                title: request.title,
                content: request.content,
                createdDate: formattedDate,
                receivedDate: request.receivedDate,
                category: request.category,
                status: getStatus(request.status),
                comments: commentContent,
            });
        });
        let count = 0
        // Apply styles to rows
        sheet.eachRow((row, rowNumber) => {
            const fill = rowNumber % 2 === 0 ? evenRowFill : oddRowFill;
            row.eachCell((cell) => {
                cell.border = borderStyle;
                cell.fill = fill;
            });
        });
        const filePath = path.join(process.cwd(), 'public', fileName);
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.log(err);
            }
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.log(error);
    }
};


module.exports = {
    handleExportExcel,
}