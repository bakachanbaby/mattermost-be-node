const Category = require('../models/category.modal');
const Request = require('../models/request.model');

// Import the necessary modules and models

// Create a new request
const createRequest = async (req, res) => {
    try {
        const {
            title,
            content,
            priority,
            status,
            categoryId,
            result,
            createdDate,
        } = req.body;

        const category = await Category.findById(categoryId);
        console.log(category);

        const highestRequest = await Request.find().sort({ code: -1 }).limit(1);
        console.log(highestRequest);
        const highestNumber = highestRequest.length > 0 ? parseInt(highestRequest[0].code.replace('KN', '')) : 0;
        console.log(highestNumber);
        const newCode = 'KN' + (highestNumber + 1);
        console.log(newCode);


        const newRequest = new Request(
            {
                code: newCode,
                title,
                content,
                priority,
                status,
                category,
                result,
                createdDate,
            }
        );
        console.log(newRequest);
        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a request by ID
const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await Request.findById(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all requests
const getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Edit a request
const editRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            content,
            priority,
            status,
            categoryId,
            result,
            createdDate,
            code,
        } = req.body;

        const category = await Category.findById(categoryId);
        console.log(category);

        const updatedRequest = await Request.findByIdAndUpdate(
            id,
            {
                title,
                content,
                priority,
                status,
                category,
                result,
                createdDate,
                code,
            },
            { new: true }
        );
        if (!updatedRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a request
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await Request.findById(id);
        const deletedRequest = await Request.findByIdAndDelete(id);
        if (!deletedRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json({ 
            message: 'Request deleted successfully',
            request: deletedRequest,
         });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createRequest,
    getRequestById,
    getAllRequests,
    editRequest,
    deleteRequest,
};