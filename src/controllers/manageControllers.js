const Book = require('../models/Book');
const Genre = require("../models/Genre");
const BookGenre = require("../models/BookGenre");

const getBooks = async (req, res) => {
    try {
        const booksWithGenres = await Book.aggregate([
            {
              $lookup: {
                from: "bookgenres",
                localField: "bookID",
                foreignField: "bookID",
                as: "bookGenres"
              }
            },
            {
              $unwind: {
                path: "$bookGenres",
                 preserveNullAndEmptyArrays: true // Giữ nguyên các cuốn sách không có thể loại
              }
            },
            {
              $lookup: {
                from: "genres",
                localField: "bookGenres.genreID",
                foreignField: "genreID",
                as: "Genres"
              }
            },
            {
              $unwind: {
                path: "$Genres",
                 preserveNullAndEmptyArrays: true // Giữ nguyên các cuốn sách không có thể loại
              }
            },
            {
              $group: {
                _id: "$_id",
                bookID: { $first: "$bookID" },
                title: { $first: "$title" },
                author: { $first: "$author" },
                summary: { $first: "$summary" },
                totalview: { $first: "$totalview" },
                status: { $first: "$status" },
                isPending: { $first: "$isPending" },
                authorName: { $first: "$authorName" },
                // Các trường thông tin khác của sách
                Genres: { $push: { $ifNull: ["$Genres.genreName", null] } } // Push null nếu không có thể loại
              }
            },
            {
              $sort: { bookID: 1 } // Sắp xếp theo bookID tăng dần (1) hoặc giảm dần (-1)
            }
          ]);
          
          //  console.log("Books with Genres:", booksWithGenres);
          return res.render('Book_management', { Books: booksWithGenres });
    } catch (err) {
        console.log(err);
        return res.status(500).render('error500');
    }
};

module.exports = {
    getBooks
};