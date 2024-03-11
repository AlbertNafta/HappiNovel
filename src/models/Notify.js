const mongoose = require("mongoose");
const { isAlphanumeric } = require("validator");

const notifySchema = new mongoose.Schema({
  notifyID: {
    type: Number,
    required: true,
  },
  typeID: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const Notify = mongoose.model("notifies", notifySchema); // Use singular "BookMark" as the model name

module.exports = Notify;
