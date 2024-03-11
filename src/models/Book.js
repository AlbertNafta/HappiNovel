const mongoose = require("mongoose")

const bookSchema = new mongoose.Schema ({
    bookID: {
        type: Number,
        unique: true,
        require: true,
    },
    title: {
        type: String,
        required: [true, 'Vui lòng nhập tên sách!'],
    },
    author: {
        type: Number,
        required: [true, 'Vui lòng nhập tên tác giả!'],
    },
    note: {
        type: String,
    },
    summary: {
        type: String,
        require: [true, 'Vui lòng nhập nội dung tóm tắt'],
    },
    publishDate: {
        type: Date,
        default: new Date(),
        required: true,
    },
    coverImg: {
        type: String,
        default: "defaultBook.jpg",
        required: false,
    },
    status: {
        type: Number,
        default: 1,
        required: true,
    },
    totalview: {
        type: Number,
        default: 0,
        require: true,
    },
    isPending: {
        type: Number,
        default: 1,
        require: true,
    },
    authorName: {
        type: String,
        require: true,
    },
    volumes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'volumes',
    }],
});


const Book = mongoose.model("books", bookSchema);
module.exports = Book