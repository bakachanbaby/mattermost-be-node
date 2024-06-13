const BotModal = require("../models/bot.model");
const bcrypt = require('bcryptjs');
const bcryptSalt = bcrypt.genSaltSync(10);

const createBot = async (req, res) => {
    const {
        botName,
        botUserId,
        ownerId,
        tokenId,
        accessToken,
        channelIds,
        teamId,
    } = req.body;
    try {
        const userDoc = await BotModal.create({
            botName,
            botUserId,
            ownerId,
            tokenId,
            accessToken,
            channelIds,
            teamId,
        });
        res.json(userDoc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBot,
};
