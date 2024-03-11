const mongoose = require("mongoose");
const { isAlphanumeric } = require("validator");

const bookMarkSchema = new mongoose.Schema({
  bookID: {
    type: Number,
    required: true,
  },
  userID: {
    type: Number,
    required: true,
  },
});

const BookMark = mongoose.model("bookmarks", bookMarkSchema); // Use singular "BookMark" as the model name

module.exports = BookMark;
