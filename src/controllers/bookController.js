const Book = require("../models/Book");
const ReadingHistory = require("../models/ReadingHistory");
const BookMark = require("../models/BookMark")
const Account = require("../models/Account");
const Chapter = require("../models/Chapter")
const Rating = require("../models/Rating")
const {bookcoverContainer} = require("../middleware/database");
const jwt = require("jsonwebtoken");

const getMostViewBooks = async (limit) => {
  try {
    const mostViewBooks = await Book.find({ status: { $ne: 3 }, isPending: { $ne: 1 } })
      .sort({ totalview: -1 })
      .limit(limit)
      .exec();
    return mostViewBooks;
  } catch (err) {
    console.error("Error fetching most viewed books: ", err);
    throw new Error("Error fetching most viewed books");
  }
};

const getMostRatingBooks = async () => {
  try {
    const mostRatingBooks = await Rating.aggregate([
      {
        $group: {
          _id: "$bookID",
          averageScore: { $avg: "$score" }
        }
      },
      {
        $lookup: {
          from: "books",
          localField: "_id", // Change localField to "_id" to match with the bookID from the ratings collection
          foreignField: "bookID",
          as: "book"
        }
      },
      {
        $unwind: "$book"
      },
      {
        $match: {
          "book.status": { $ne: 3 }, // Filter out books with status equal to 3
          "book.isPending": { $ne: 1 } // Filter out books with isPending equal to 1
        }
      },
      {
        $sort: { averageScore: -1 } // Sort by averageScore in descending order
      },
      {
        $limit: 4
      },
      {
        $project: {
          _id: 0,
          bookID: "$_id",
          averageScore: 1 // Include the averageScore in the output
        }
      }
    ]).exec();
    return mostRatingBooks;
  } catch (err) {
    console.error("Error fetching most rating books: ", err);
    throw new Error("Error fetching most rating books");
  }
};


const getMostFollowedBooks = async () => {
  try {
    const mostFollowedBooks = await BookMark.aggregate([
      {
        $lookup: {
          from: "books", // Replace with the actual collection name for books
          localField: "bookID",
          foreignField: "bookID",
          as: "book"
        }
      },
      {
        $unwind: "$book"
      },
      {
        $match: {
          "book.status": { $ne: 3 }, // Filter out books with status equal to 3
          "book.isPending": { $ne: 1 } // Filter out books with isPending equal to 1
        }
      },
      {
        $group: {
          _id: "$bookID",
          bookmarkCount: { $sum: 1 }
        }
      },
      {
        $sort: {
          bookmarkCount: -1 // Sort by bookmarkCount in descending order (most bookmarks first)
        }
      },
      {
        $limit: 4 // Limit the results to the top three books
      },
      {
        $project: {
          _id: 0,
          bookID: "$_id",
          bookmarkCount: 1
        }
      }
    ]).exec();

    return mostFollowedBooks;
  } catch (err) {
    console.error("Error fetching most followed books: ", err);
    throw new Error("Error fetching most followed books");
  }
};


const getNewestChapters = async () => {
  try {
    const newestChapters = await Chapter.aggregate([
      {
        $lookup: {
          from: "books",
          localField: "bookID",
          foreignField: "bookID",
          as: "book"
        }
      },
      {
        $unwind: "$book"
      },
      {
        $match: {
          "book.status": { $ne: 3 }, // Filter out chapters with books having status equal to 3
          "book.isPending": { $ne: 1 }, // Filter out chapters with books having isPending equal to 3
          "isPending": { $ne: 1 } // Filter out chapters with isPending equal to 1
        }
      },
      {
        $sort: {
          "publishDate": -1 // Sort by publishDate in descending order (latest chapter first)
        }
      }
    ]).exec();
    const uniqueBookIDs = {};
    const filteredBooks = newestChapters.filter(item => {
      if (!uniqueBookIDs[item.bookID] && Object.keys(uniqueBookIDs).length < 16) {
        uniqueBookIDs[item.bookID] = true;
        return true;
      }
      return false;
    });
    return filteredBooks;
  } catch (err) {
    console.error("Error fetching chapters: ", err);
    throw new Error("Error fetching chapters");
  }
};


const getNewestBooks = async () => {
  try {
    const newestBooks = await Book.find({ status: { $ne: 3 }, isPending: { $ne: 1 } })
      .sort({ publishDate: -1 })
      .limit(8)
      .exec();
    return newestBooks;
  } catch (err) {
    console.error("Error fetching newest books: ", err);
    throw new Error("Error fetching newest books");
  }  
};


const getReadingHistory = async (UserID) => {
  try {
    const readingHistory = await ReadingHistory.aggregate([
      {
        $match: {
          userID: UserID
        }
      },
      {
        $lookup: {
          from: "books", // Replace with the actual collection name for books
          localField: "bookID",
          foreignField: "bookID",
          as: "book"
        }
      },
      {
        $unwind: "$book"
      },
      {
        $match: {
          "book.status": { $ne: 3 }, // Filter out books with status equal to 3
        }
      },
      {
        $sort: {
          _id: -1 // Sorting by _id in descending order
        }
      },
      {
        $limit: 4
      },
      {
        $project: {
          _id: 0,
          book: 1 // Project the entire "book" object
        }
      }
    ]).exec();
    return readingHistory;
  } catch (err) {
    console.error("Error fetching reading history:", err);
    throw new Error("Error fetching reading history");
  }
};

const getFinishedBooks = async() => {
  try {
    const finishedBooks = await Book.find({ status: 2, isPending: { $ne: 1 } }).limit(12).exec();
    return finishedBooks;
  } catch (err) {
    console.error("Error fetching books: ", err);
    throw new Error("Error fetching books");
  }  
};

const getBooksAndReadingHistory = async (req, res) => {
  try {
    const mostViewBooks = await getMostViewBooks(24); // Fetch most viewed books
    const newestBooks = await getNewestBooks();
    const mostFollowedBooks = await getMostFollowedBooks();
    const newestChapter = await getNewestChapters();
    const finishedBooks = await getFinishedBooks();
    const mostRatingBooks = await getMostRatingBooks();
    const books =  await Book.find();
    const totalFollows = mostFollowedBooks.map(book => book.bookmarkCount)
    const bookHashMap = {};
    const bookCoverURL = {};
    books.forEach((book) => {
      bookHashMap[book.bookID] = book;
      bookCoverURL[book.bookID] = bookcoverContainer.getBlobClient(book.coverImg).url
    });
    const token = req.cookies.jwt;
    let readingHistory = [];
    if (token) {
      const decodedToken = jwt.verify(token, "information of user");
      const user = await Account.findById(decodedToken.id);
      if (user) {
        readingHistory = await getReadingHistory(user.userID); // Fetch reading history data if the user is logged in
      }
    }
    res.render("home", { mostViewBooks,readingHistory,bookHashMap, newestBooks,mostFollowedBooks, newestChapter, finishedBooks, bookCoverURL, totalFollows, mostRatingBooks}); // Pass both books and readingHistory to the home.ejs template
  } catch (err) {
    console.error("Error fetching books and reading history:", err);
    res.status(500).send("Internal Server Error");
  }
};
module.exports = {
  getBooksAndReadingHistory,
};