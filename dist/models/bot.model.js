const mongoose = require('mongoose');
const {
  Schema
} = mongoose;
const BotSchema = new Schema({
  botName: String,
  botUserId: String,
  ownerId: String,
  tokenId: String,
  accessToken: String,
  channelIds: [String],
  teamId: String,
  botChannelId: String
});
const BotModel = mongoose.model('Bot', BotSchema);
module.exports = BotModel;