// Assuming you have a 'User' model to fetch user data
const mongoose = require("mongoose");
const Account = require("../models/Account");
const jwt = require("jsonwebtoken");
const path = require("path");
const Book = require("../models/Book");
const Volume = require("../models/Volume");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { bookContainer } = require("../middleware/database");
const Chapter = require("../models/Chapter");
const ReadingHistory = require("../models/ReadingHistory");

exports.readinghistory = async (req, res) => {
  // <-- Add 'async' here
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(404).render('404');
    }
    const decodedToken = jwt.verify(token, "information of user");
    const user = await Account.findById(decodedToken.id);
    const BookMId = await ReadingHistory.find({ userID: user.userID }).sort({ _id: -1 });
    const uniqueBookIds = new Set();
    // Loop through the bookmarks and find the unique book IDs
    for (const readHis of BookMId) {
      uniqueBookIds.add(readHis.bookID);
    }
    const matchedBooks = [];
    for (const bookID of uniqueBookIds) {
      try {
        const book = await Book.findOne({ bookID }); // Assuming you have a 'Book' model

        if (book) {
          // Book with the given bookID found, add it to the array
          matchedBooks.push(book);
        }
      } catch (err) {
        console.error("Error finding book:", err);
      }
    }

    if (!user) {
      throw new Error("User not found");
    }

    const volumes = await Volume.find({});
    const chapters = await Chapter.find({});

    res.render("readinghistory", { matchedBooks, BookMId, chapters, volumes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteHis = async (req, res) => {

  try {
    const { chap_id } = req.body; // Retrieve chap_id from request body
    console.log(chap_id);

    await ReadingHistory.deleteOne({ _id: chap_id }); // Delete the reading history entry
    //    const read = await ReadingHistory.findOne({ _id: chap_id })
    // console.log(read);

    return res.status(200).send("Reading history entry deleted successfully.");
  } catch (error) {
    console.error("Error deleting reading history:", error);
    return res.status(500).send("Internal server error.");
  }
};
