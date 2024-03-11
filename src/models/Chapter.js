const mongoose = require("mongoose")
const {isAlphanumeric} = require('validator')

const chapterSchema = new mongoose.Schema ({
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
    chapName: {
        type: String,
        required: [true, 'Vui lòng nhập tên chương!'],
    },
    publishDate: {
        type: Date,
        default: new Date(),
        require: true,
    },
    contentfile: {
        type: String,
        require: true,
    },
    updatefile: {
        type: String,
        default: "",
    },
    isPending: {
        type: Number,
        default: 1,
        require: true,
    },
    
});


const Chapter = mongoose.model("chapters", chapterSchema);
module.exports = Chapter