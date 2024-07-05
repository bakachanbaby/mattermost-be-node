const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Category = require('../models/category.modal');
const { type } = require('os');
const { REQUEST_STATUS } = require('../enums/define');
const Request = require('../models/request.model');

const handleExportExcel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet1');

        sheet.columns = [
            { header: 'ID', key: 'id' },
            { header: 'Title', key: 'title' },
            { header: 'Content', key: 'content' },
            { header: 'Status', key: 'status' },
            { header: 'Result', key: 'result' },
            { header: 'Created Date', key: 'createdDate' },
            { header: 'Category', key: 'category' },
        ];

        const requests = await Request.find({
            status: REQUEST_STATUS.APPROVED
        });

        requests.forEach((request) => {
            sheet.addRow({
                id: request._id,
                title: request.title,
                content: request.content,
                status: request.status,
                result: request.result,
                createdDate: request.createdDate,
                category: request.category
            });
        });

        const fileName = 'report.xlsx';
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