const express = require("express");
const router = express.Router();
const {
  createBot
} = require('../controllers/bot.controller');
router.post("/create", createBot);
module.exports = router;