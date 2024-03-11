const mongoose = require("mongoose");
const { isAlphanumeric } = require("validator");

const bookgenreSchema = new mongoose.Schema({
  bookID: {
    type: Number,
    required: true,
  },
  genreID: {
    type: Number,
    required: true,
  },
});

const BookGenre = mongoose.model("bookgenres", bookgenreSchema); // Use singular "BookMark" as the model name

module.exports = BookGenre;
