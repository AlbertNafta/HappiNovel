const Book = require('../models/Book');
const Volume = require("../models/Volume");
const Chapter = require("../models/Chapter");

const getBooks = async (req, res) => {
    try {
      const booksWithAuthors = await Book.aggregate([
        {
          $match: {
            isPending: 1,
          },
        },
        {
          $lookup: {
            from: 'accounts', // Tên collection "accounts"
            localField: 'author',
            foreignField: 'userID',
            as: 'authorInfoo',
          },
        },
        {
          $unwind: '$authorInfoo',
        },
        {
          $project: {
            bookID: 1,
            title: 1,
            author: 1,
            authorName: 1,
            isPending:1,
            // Thêm các trường thông tin của sách bạn muốn lấy
            username: '$authorInfoo.username', // Lấy trường username từ authorInfo
          },
        },
      ]);
      
        const Pendings = await Chapter.aggregate([
            {
              $lookup: {
                from: "books",
                localField: "bookID",
                foreignField: "bookID",
                as: "bookInfo"
              }
            },
            {
              $lookup: {
                from: "volumes",
                localField: "volID",
                foreignField: "volID",
                as: "volumeInfo"
              }
            },
            {
              $unwind: "$bookInfo"
            },
            {
              $unwind: "$volumeInfo"
            },
            {
              $lookup: {
                from: "accounts",
                localField: "bookInfo.author",
                foreignField: "userID",
                as: "userInfo"
              }
            },
            {
              $unwind: "$userInfo"
            },
            {
              $match: {
                $or: [{ isPending: 1 }, { isPending: 2 }],
              },
            },
            {
              $group: {
                _id: {
                  chapID: "$chapID",
                  bookID: "$bookID",
                  volID: "$volID"
                }, // Nhóm theo trường chapID
                bookID: { $first: "$bookID" },
                volID: { $first: "$volID" },
                chapID: { $first: "$chapID" },
                chapName: { $first: "$chapName" },
                contentfile: { $first: "$contentfile" },
                updatefile: { $first: "$updatefile" },
                isPending: { $first: "$isPending" },
                bookTitle: { $first: "$bookInfo.title" },
                volumeTitle: { $first: "$volumeInfo.volName" },
                bookPending: { $first: "$bookInfo.isPending" },
                username: { $first: "$userInfo.username" },
                bookauthor: { $first: "$bookInfo.authorName" },
              }
            },
            
            {
              $sort: { bookID: 1 } // Sắp xếp theo bookID tăng dần (1) hoặc giảm dần (-1)
            }
            
          ]);
          
          //  console.log("Books with Genres:", booksWithGenres);
          return res.render('Pending_management', { Pendings: Pendings,Books: booksWithAuthors });
    } catch (err) {
        console.log(err);
        return res.status(500).render('error500');
    }
};

module.exports = {
    getBooks
};