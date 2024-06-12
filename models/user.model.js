const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  userId: String,
  channelId: String,
  channelName: String,
  teamId: String,
  teamDomain: String,
  role: {
    type: String,
    default: 'nv',
  },
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;