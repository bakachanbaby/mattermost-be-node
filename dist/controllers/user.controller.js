const User = require("../models/user.model");
const bcrypt = require('bcryptjs');
const bcryptSalt = bcrypt.genSaltSync(10);
const register = async (req, res) => {
  const {
    username,
    email,
    password,
    userId,
    channelId,
    channelName,
    teamId,
    teamDomain,
    role
  } = req.body;
  try {
    const userDoc = await User.create({
      username,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
      userId,
      channelId,
      channelName,
      teamId,
      teamDomain,
      role: role || 'nv'
    });
    res.json(userDoc);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
module.exports = {
  register
};