const Book = require('../models/Book');
const Genres = require('../models/Genre');
const BookGenre = require('../models/BookGenre')
const { bookcoverContainer } = require('../middleware/database');

const getBooksByTitle = async (titleSearch) => {
  try {
    let query = { status: { $ne: 3 }, isPending: { $ne: 1 } };
    if (titleSearch && titleSearch.trim() !== "") {
      const escapedTitleSearch = titleSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');                 // Escape question mark
    query.title = { $regex: escapedTitleSearch, $options: "i" };      query.title = { $regex: escapedTitleSearch, $options: "i" };
    }
    const books = await Book.find(query).exec();
    return books;
  } catch (err) {
    throw new Error("Error fetching books by title: " + err.message);
  }
};

const getBooksByAuthor = async (authorSearch) => {
  try {
    let query = { status: { $ne: 3 }, isPending: { $ne: 1 } };
    if (authorSearch && authorSearch.trim() !== "") {
      query.authorName = { $regex: authorSearch, $options: "i" };
    }
    const books = await Book.find(query).exec();
    return books;
  } catch (err) {
    throw new Error("Error fetching books by author: " + err.message);
  }
};

const getStatusBooks = async (req, res) => {
  const selectedStatus = req.query.status;
  try {
    if (!selectedStatus || isNaN(selectedStatus) || selectedStatus === '3') {
      // Return all books if no status is selected
      const allBooks = await Book.find({ status: { $ne: 3 }, isPending: { $ne: 1 } }).exec();
      return allBooks;
    }

    const parsedStatus = parseInt(selectedStatus);
    const statusBooks = await Book.find({ status: parsedStatus, isPending: { $ne: 1 } }).exec();
    return statusBooks;
  } catch (err) {
    console.error("Error fetching books by status: ", err);
    throw new Error("Error fetching books by status");
  }
};

const getBooksByGenres = async (selectedGenres) => {
  try {
    if (!selectedGenres) {
      return await Book.find({ status: { $ne: 3 }, isPending: { $ne: 1 } }).exec();
    }

    const selectedGenreIDs = Array.isArray(selectedGenres) ? selectedGenres.map(Number) : [Number(selectedGenres)];

    // Find books that have all selected genres
    const booksWithAllSelectedGenres = await BookGenre.aggregate([
      {
        $match: { genreID: { $in: selectedGenreIDs } }
      },
      {
        $group: {
          _id: "$bookID",
          genres: { $addToSet: "$genreID" },
          count: { $sum: 1 }
        }
      },
      {
        $match: { genres: { $size: selectedGenreIDs.length } }
      },
      {
        $match: { count: selectedGenreIDs.length }
      }
    ]).exec();

    const bookIDs = booksWithAllSelectedGenres.map(entry => entry._id);

    const books = await Book.find({ bookID: { $in: bookIDs }, status: { $ne: 3 }, isPending: { $ne: 1 } }).exec();

    return books;
  } catch (err) {
    throw new Error("Error fetching books by genres: " + err.message);
  }
};

const getSearchResult = async (req, res) => {
  try {
    const genres = await Genres.find().sort({ genreName: 1 }).exec();

    const titleBooksNav = await getBooksByTitle(req.query.navSearch);
    //console.log(titleBooksNav);
    const titleBooksFilter = await getBooksByTitle(req.query.filterSearch);
    const authorBooks = await getBooksByAuthor(req.query.authorSearch);
    const statusBooks = await getStatusBooks(req, res);
    const genresBooks = await getBooksByGenres(req.query.genre);

    const allBooks = await Book.find({ status: { $ne: 3 }, isPending: { $ne: 1 } }).exec();
    const intersectedBooks = allBooks.filter(book =>
      titleBooksNav.some(navBook => navBook._id.equals(book._id)) &&
      titleBooksFilter.some(filterBook => filterBook._id.equals(book._id)) &&
      authorBooks.some(authorBook => authorBook._id.equals(book._id)) &&
      statusBooks.some(statusBook => statusBook._id.equals(book._id)) &&
      genresBooks.some(genresBook => genresBook._id.equals(book._id))
    );

    const bookHashMap = {};
    const bookCoverURL = {};
    intersectedBooks.forEach((book) => {
      bookHashMap[book.bookID] = book;
      bookCoverURL[book.bookID] = bookcoverContainer.getBlobClient(book.coverImg).url;
    });

    res.render('filter', { genres, intersectedBooks, bookHashMap, bookCoverURL });
  } catch (err) {
    console.error('Error fetching books: ', err);
    res.status(500).send('Error fetching books');
  }
};

module.exports = {
  getSearchResult,
};
