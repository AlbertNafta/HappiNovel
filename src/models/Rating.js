const mongoose = require("mongoose")
const {isAlphanumeric} = require('validator')

const ratingSchema = new mongoose.Schema ({
    bookID: {
        type: Number,
        require: true,
    },
    userID: {
        type: Number,
        require: true,
    },
    contentfile: {
        type: String,
        default: '',
    },
    score: {
        type: Number,
        default: 0,
        require: true,
    },
    
});


const Rating = mongoose.model("ratings", ratingSchema);
module.exports = Rating