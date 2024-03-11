// profileController.js
const mongoose = require("mongoose");
const BookMark = require("../models/BookMark");
const Account = require("../models/Account");
const jwt = require("jsonwebtoken");
const path = require("path");
const Book = require("../models/Book");
const bcrypt = require("bcrypt");
const fs = require("fs");
const Comment = require("../models/Comment");
const { bookContainer } = require("../middleware/database");
const Genre = require("../models/Genre");
const bookgenres = require("../models/BookGenre");


// Import the formatDate function from dateHelpers.js
const formatDate = require("../public/js/dateHelpers");
const formatStatus = require("../public/js/statusBook");

exports.profilePage = async (req, res) => {
  try {
    const token = req.cookies.jwt;

    
    if (!token) {
      const IDuser = req.params.id;    
   
    
    const user = await Account.findOne({ userID: IDuser });
    if (!user) {
      return res.status(404).render('404');
    }
    const Anotheruser = await Account.findOne({ userID: IDuser });
    const trueUser = null;
    
    const matchedBooks = await Book.find({ author: user.userID, status: {$ne: 3} ,isPending: {$ne: 1}});
    const BookMId = await BookMark.find({ userID: user.userID });
    const Makedbook = [];

    for (const bookmark of BookMId) {
      try {
        const bookID = bookmark.bookID;
        const book = await Book.findOne({ bookID }); // Assuming you have a 'Book' model

        if (book) {
          
            // Book with the given bookID found, add it to the array
            Makedbook.push(book);
        
          
        }
      } catch (err) {
        console.error("Error finding book:", err);
      }
    }
    if (!user) {
      throw new Error("User not found");
    }
    const genreNames = [];
    const NumComment = await Comment.find({ userID: user.userID });
    for (const bookmark of matchedBooks) {
      const bookID = bookmark.bookID;

      
        const genreIDs = await bookgenres.findOne({ bookID });
        
        let genreName;
        if(!genreIDs){
          genreName = "Not found genre";
        }else{
          const genreID = genreIDs.genreID;
          const genre = await Genre.findOne({ genreID });
        genreName = genre ? genre.genreName : "Not found genre";
        }

        genreNames.push({ genreName });
      
    }

  

    const formattedGenreNames = genreNames.map((item) => item.genreName);

    // Helper function to get the full cover image path
    // Assuming you have a 'profile' view to render the profile page
    const chaptersCount = await countChapters(matchedBooks);
    res.render("profile", {
      trueUser,
      Anotheruser,
      formatDate,
      matchedBooks,
      checkOldPassword,
      chaptersCount,
      formatStatus,
      Makedbook,
      NumComment,
      formattedGenreNames,
    });
    }
    
    
    else{
    
    const IDuser = req.params.id;

    trueIDuser = parseInt(IDuser);
    const decodedToken = jwt.verify(token, "information of user"); // will use later
    
    const user = await Account.findOne({ userID: IDuser });
    if (!user) {
      return res.status(404).render('404');
    }
    const Anotheruser = await Account.findOne({ userID: IDuser });
    const trueUser = await Account.findById(decodedToken.id);
    
    const matchedBooks = await Book.find({ author: user.userID, status: {$ne: 3}, isPending: {$ne: 1}});
    const BookMId = await BookMark.find({ userID: user.userID });
    const Makedbook = [];

    for (const bookmark of BookMId) {
      try {
        const bookID = bookmark.bookID;
        const book = await Book.findOne({ bookID }); // Assuming you have a 'Book' model

        if (book) {
          
            // Book with the given bookID found, add it to the array
            Makedbook.push(book);
        
          
        }
      } catch (err) {
        console.error("Error finding book:", err);
      }
    }
    if (!user) {
      throw new Error("User not found");
    }
    const genreNames = [];
    const NumComment = await Comment.find({ userID: user.userID });
    for (const bookmark of matchedBooks) {
      const bookID = bookmark.bookID;

      
        const genreIDs = await bookgenres.findOne({ bookID });
        
        let genreName;
        if(!genreIDs){
          genreName = "Not found genre";
        }else{
          const genreID = genreIDs.genreID;
          const genre = await Genre.findOne({ genreID });
        genreName = genre ? genre.genreName : "Not found genre";
        }

        genreNames.push({ genreName });
      
    }

  

    const formattedGenreNames = genreNames.map((item) => item.genreName);

    // Helper function to get the full cover image path
    // Assuming you have a 'profile' view to render the profile page
    const chaptersCount = await countChapters(matchedBooks);
    res.render("profile", {
      trueUser,
      Anotheruser,
      formatDate,
      matchedBooks,
      checkOldPassword,
      chaptersCount,
      formatStatus,
      Makedbook,
      NumComment,
      formattedGenreNames,
    });}
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
};

const checkOldPassword = async (user, oldPassword) => {
  try {
    // Check if the old password matches the hashed password stored in the user object
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    return isPasswordMatch;
  } catch (err) {
    console.error("Error checking old password:", err);
    return false; // Return false in case of an error
  }
};

async function countChapters(matchedBooks) {
  let chaptersCount = 0;

  for (const book of matchedBooks) {
    const bookDirectory = `Book${book.bookID}`;

    try {
      // Get the list of blobs (chapter files) in the book's directory
      const blobs = bookContainer.listBlobsFlat({ prefix: bookDirectory });

      // Filter blobs based on the book's volume directories
      const volumeDirectories = new Set();
      for await (const blob of blobs) {
        // Check if the blob belongs to a volume directory
        const volumeName = getVolumeName(bookDirectory, blob.name);
        if (volumeName) {
          volumeDirectories.add(volumeName);
          chaptersCount++;
        }
      }
    } catch (err) {
      console.error(`Error reading book directory: ${bookDirectory}`);
    }
  }

  return chaptersCount;
}

// Helper function to check if the blob belongs to a volume directory
function getVolumeName(bookDirectory, blobName) {
  const prefix = bookDirectory + "/Volume";
  if (blobName.startsWith(prefix)) {
    const endIndex = blobName.indexOf("/", prefix.length);
    if (endIndex !== -1) {
      return blobName.slice(0, endIndex);
    }
  }
  return null;
}

const { profilecoverContainer } = require('../middleware/database');

exports.updateCoverImage = async (req, res) => {
  try {
    
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, 'information of user'); // will use later
    
    const file = req.file; // Assuming you're using Multer middleware for file uploads
    const trueUser = await Account.findById(decodedToken.id);
    
    
    if (!file) {// Generate a unique image name
      return res.status(400).send('No file uploaded.');
    }
    const coverImgName = `pcover${trueUser.userID}.jpg`
    await Account.findOneAndUpdate(
      {userID: trueUser.userID,},
      {coverURL: coverImgName,},
    
    )
    const blockBlobClient = profilecoverContainer.getBlockBlobClient(coverImgName);

    await blockBlobClient.uploadData(file.buffer, file.buffer.length);

    // Update the user's cover image URL in the database
    // You will need to implement this part based on your database schema

    return res.status(200).send('Cover image uploaded successfully.');
  } catch (error) {
    console.error('Error uploading cover image:', error);
    return res.status(500).send('Internal server error.');
  }
};
const { avatarContainer } = require('../middleware/database');
exports.updateAvaImage = async (req, res) => {
  
  try {
    
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, 'information of user'); // will use later
    
    const file = req.file; // Assuming you're using Multer middleware for file uploads
    const trueUser = await Account.findById(decodedToken.id);
    
    
    if (!file) {// Generate a unique image name
      return res.status(400).send('No file uploaded.');
    }
    const coverImgName = `img${trueUser.userID}.jpg`
    await Account.findOneAndUpdate(
      {userID: trueUser.userID,},
      {avatarURL: coverImgName,},
    
    )
    const blockBlobClient = avatarContainer.getBlockBlobClient(coverImgName);

    await blockBlobClient.uploadData(file.buffer, file.buffer.length);

    // Update the user's cover image URL in the database
    // You will need to implement this part based on your database schema

    return res.status(200).send('Cover image uploaded successfully.');
  } catch (error) {
    console.error('Error uploading cover image:', error);
    return res.status(500).send('Internal server error.');
  }
};


exports.chang_pass = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, 'information of user'); // will use later
    const trueUser = await Account.findById(decodedToken.id);
    const oldpass = req.body.inputValue;
    const newpass = req.body.inputValue2;

    const isPasswordValid = await bcrypt.compare(oldpass, trueUser.password);
    
    if (isPasswordValid) {
      if (newpass) {
        const hashedNewPassword = await bcrypt.hash(newpass, 10);
        await Account.findByIdAndUpdate(trueUser._id, { password: hashedNewPassword });
        return res.status(200).send('Password updated successfully.');
      }
    } else {
      return res.status(400).send('Invalid old password.');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).send('Internal server error.');
  }
};


exports.bio = async (req, res) => {
  
  try {
    
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, 'information of user'); // will use later
    const trueUser = await Account.findById(decodedToken.id);
    const newbio = req.body.cleanedContent
    await Account.findByIdAndUpdate(trueUser._id, { bio: newbio });

  } catch (error) {
    console.error('Error uploading cover image:', error);
    return res.status(500).send('Internal server error.');
  }
};

