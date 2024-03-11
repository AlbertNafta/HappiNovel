const mongoose = require("mongoose")
const {isAlphanumeric} = require('validator')

const volumeSchema = new mongoose.Schema ({
    bookID: {
        type: Number,
        require: true,
    },
    volID: {
        type: Number,
        require: true,
    },
    volName: {
        type: String,
        required: [true, 'Vui lòng nhập tên chương!'],
    },
    isDeleted: {
        type: Number,
        default: 0,
    },
    chapters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chapters',
    }]
});


const Volume = mongoose.model("volumes", volumeSchema);
module.exports = Volume