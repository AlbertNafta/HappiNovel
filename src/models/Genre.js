const mongoose = require("mongoose");
const { isAlphanumeric } = require("validator");

const genreSchema = new mongoose.Schema({
  genreID: {
    type: Number,
    required: true,
  },
  genreName: {
    type: String,
    required: true,
  },
});

const Genre = mongoose.model("genres", genreSchema); // Use singular "BookMark" as the model name

module.exports = Genre;
