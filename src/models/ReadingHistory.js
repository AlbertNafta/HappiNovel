const mongoose = require("mongoose")
const {isAlphanumeric} = require('validator')

const readingHistorySchema = new mongoose.Schema ({
    userID: {
        type: Number,
        require: true,
    },
    bookID: {
        type: Number,
        require: true,
    },
    volID: {
        type: Number,
        require: true,
    },
    chapID: {
        type: Number,
        require: true,
    },
});


const ReadingHistory = mongoose.model("readinghistories", readingHistorySchema);
module.exports = ReadingHistory