const mongoose = require("mongoose");
const { isAlphanumeric } = require("validator");

const notifyOfUserSchema = new mongoose.Schema({
  notifyID: {
    type: Number,
    required: true,
  },
  userID: {
    type: Number,
    required: true,
  },
});

const NotifyOfUser = mongoose.model("notifyofusers", notifyOfUserSchema); // Use singular "BookMark" as the model name

module.exports = NotifyOfUser;
