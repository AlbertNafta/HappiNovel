const { BlobServiceClient } = require("@azure/storage-blob");
const Account = require("../models/Account");
const jwt = require("jsonwebtoken");
const path = require("path");
const Book = require("../models/Book");
const Volume = require("../models/Volume");
const Genre = require("../models/Genre");
const bookgenres = require("../models/BookGenre");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { bookContainer } = require("../middleware/database");
const Chapter = require("../models/Chapter");
const ReadingHistory = require("../models/ReadingHistory");
const Notify = require("../models/Notify");
const notifyofusers = require("../models/NotifyOfUser");
const Comment = require("../models/Comment");
const { notifyContainer } = require("../middleware/database");
const { commentContainer } = require("../middleware/database");
const mongoose = require("mongoose");
const mammoth = require('mammoth');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

exports.notification = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(404).render('404');
    }
    const decodedToken = jwt.verify(token, "information of user");
    const user = await Account.findById(decodedToken.id);
    // Loop through the bookmarks and find the unique book IDs

    if (!user) {
      throw new Error("User not found");
    }

    const notifyIDs = await Notify.aggregate([
      {
        $match: { typeID: 1 },
      },
      {
        $lookup: {
          from: "notifyofusers", // Replace with the name of the notifyofusers collection
          localField: "notifyID",
          foreignField: "notifyID",
          as: "notifyofusers",
        },
      },
      {
        $unwind: "$notifyofusers",
      },
      {
        $match: { "notifyofusers.userID": user.userID }, // Change the userID value as needed
      },
      {
        $group: {
          _id: "$notifyID",
        },
      },
    ]);

    const notifyID2 = await Notify.aggregate([
      {
        $match: { typeID: 2 },
      },
      {
        $lookup: {
          from: "notifyofusers", // Replace with the name of the notifyofusers collection
          localField: "notifyID",
          foreignField: "notifyID",
          as: "notifyofusers",
        },
      },
      {
        $unwind: "$notifyofusers",
      },
      {
        $match: { "notifyofusers.userID": user.userID }, // Change the userID value as needed
      },
      {
        $group: {
          _id: "$notifyID",
        },
      },
    ]);

    const notifyID3 = await Notify.aggregate([
        {
          $match: { typeID: 3 },
        },
        {
          $lookup: {
            from: "notifyofusers", // Replace with the name of the notifyofusers collection
            localField: "notifyID",
            foreignField: "notifyID",
            as: "notifyofusers",
          },
        },
        {
          $unwind: "$notifyofusers",
        },
        {
          $match: { "notifyofusers.userID": user.userID }, // Change the userID value as needed
        },
        {
          $group: {
            _id: "$notifyID",
          },
        },
      ]);

      const notifyID4 = await Notify.aggregate([
        {
          $match: { typeID: 4 },
        },
        {
          $lookup: {
            from: "notifyofusers", // Replace with the name of the notifyofusers collection
            localField: "notifyID",
            foreignField: "notifyID",
            as: "notifyofusers",
          },
        },
        {
          $unwind: "$notifyofusers",
        },
        {
          $match: { "notifyofusers.userID": user.userID }, // Change the userID value as needed
        },
        {
          $group: {
            _id: "$notifyID",
          },
        },
      ]);
      const notifyID5 = await Notify.aggregate([
        {
          $match: { typeID: 5 },
        },
        {
          $lookup: {
            from: "notifyofusers", // Replace with the name of the notifyofusers collection
            localField: "notifyID",
            foreignField: "notifyID",
            as: "notifyofusers",
          },
        },
        {
          $unwind: "$notifyofusers",
        },
        {
          $match: { "notifyofusers.userID": user.userID }, // Change the userID value as needed
        },
        {
          $group: {
            _id: "$notifyID",
          },
        },
      ]);

    //   console.log(notifyIDs);

    const notifyData = [];
    const notifyData2 = [];
    const notifyData3 = [];
    const notifyData4 = [];
    const notifyData5 = [];

    for (const notify of notifyIDs) {
      const notifyID = notify._id;
      
      const GeTnotify = await notifyofusers.findOne({userID:user.userID,notifyID:notifyID});
      const IDnotify = GeTnotify.id;


      const { chapID, volID, bookID } = await readNotifyFile(notifyID);
      
      // Fetch chapName from the Chapter collection
      const chapterData = await Chapter.findOne({ bookID, volID, chapID });
      const chap_id = chapterData._id;
      const chapName = chapterData
        ? chapterData.chapName
        : "Chap Name Not Found";

      // Fetch volName from the Volume collection
      const volumeData = await Volume.findOne({ bookID, volID });
      const volName = volumeData ? volumeData.volName : "Vol Name Not Found";

      // Fetch bookName from the Book collection
      const bookData = await Book.findOne({ bookID });
      const bookName = bookData ? bookData.title : "Book Name Not Found";
      const bookIMG = bookData ? bookData.coverImg : "Book Name Not Found";
      if(bookData.status!=3){
        const genreIDs = await bookgenres.findOne({ bookID });
        let genreName;
        if(!genreIDs){
          genreName =  "Not found genre";
        }else{
        const genreID =  genreIDs.genreID ;
        
        const genre = await Genre.findOne({ genreID });
        genreName = genre.genreName;
      }

    
      notifyData.push({
        chap_id,
        IDnotify,
        notifyID,
        chapID,
        volID,
        bookID,
        chapName,
        volName,
        bookName,
        bookIMG,
        genreName,
      });
    }
    }

    for (const notify of notifyID2) {
      const notifyID = notify._id;
      const { bookID } = await readNotifyFile2n3(notifyID);
      const GeTnotify = await notifyofusers.findOne({userID:user.userID,notifyID:notifyID});
      const IDnotify = GeTnotify.id;  
      // Fetch bookName from the Book collection
      const bookData = await Book.findOne({ bookID });
      const bookName = bookData ? bookData.title : "Book Name Not Found";
      const bookIMG = bookData ? bookData.coverImg : "Book Name Not Found";
      if(bookData.status!=3){
        const genreIDs = await bookgenres.findOne({ bookID });
        let genreName;
        if(!genreIDs){
          genreName =  "Not found genre";
        }else{
        const genreID =  genreIDs.genreID ;
        
        const genre = await Genre.findOne({ genreID });
        genreName = genre.genreName;
      }
      
      notifyData2.push({
        IDnotify,
        notifyID,
        bookID,
        bookName,
        bookIMG,
        genreName,
      });
    }
    }

    for (const notify of notifyID3) {
        const notifyID = notify._id;
        const  bookName  = await readNotifyFile3(notifyID);
  
        // Fetch bookName from the Book collection
        const GeTnotify = await notifyofusers.findOne({userID:user.userID,notifyID:notifyID});
        const IDnotify = GeTnotify.id; 
     
        
        
        notifyData3.push({
          notifyID,
          IDnotify,
          bookName,
          
        });
      }

      for (const notify of notifyID4) {
        const notifyID = notify._id;
        const { userID,commentID } = await readNotifyFile4(notifyID);
        const GeTnotify = await notifyofusers.findOne({userID:user.userID,notifyID:notifyID});
        const IDnotify = GeTnotify.id; 
        // Fetch bookName from the Book collection
        const userData = await Account.findOne({ userID });
        const userName = userData ? userData.profileName : "User Not Found";
        let comment;
        if(commentID.length < 15){
         comment = await Comment.findOne({ commentID });
     
        }
        else{
          comment = await Comment.findById( commentID );
        }
    
        const commentData = comment ? comment.contentfile : "Not found comment";
      
       
        
        notifyData4.push({
          IDnotify,
          notifyID,
          userName,
          commentData,
        });
      }

      for (const notify of notifyID5) {
        const notifyID = notify._id;
        const { bookID } = await readNotifyFile5(notifyID);
        const GeTnotify = await notifyofusers.findOne({userID:user.userID,notifyID:notifyID});
        const IDnotify = GeTnotify.id;   
        // Fetch bookName from the Book collection
        const bookData = await Book.findOne({ bookID });
        const bookName = bookData ? bookData.title : "Book Name Not Found";
        const bookIMG = bookData ? bookData.coverImg : "Book Name Not Found";
        if(bookData){
        if(bookData.status!=3){
        const genreIDs = await bookgenres.findOne({ bookID });
        let genreName;
        if(!genreIDs){
          genreName =  "Not found genre";
        }else{
        const genreID =  genreIDs.genreID ;
        
        const genre = await Genre.findOne({ genreID });
        genreName = genre.genreName;
      }
        
        notifyData5.push({
          IDnotify,
          notifyID,
          bookID,
          bookName,
          bookIMG,
          genreName,
        });
      }
      }}
    
    res.render("notification", { notifyData, notifyData2,notifyData3,notifyData5,notifyData4 });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
};

async function readNotifyFile(notifyID) {
  const blobName = `Noti${notifyID}.txt`;

  try {
    const blobClient = notifyContainer.getBlobClient(blobName); // Use the notifyContainer
    const response = await blobClient.download();
    const data = await streamToString(response.readableStreamBody);
    const lines = data.trim().split("\n");

    if (lines.length !== 3) {
      console.error(`Invalid file format for Noti${notifyID}.txt`);
      return null;
    }
    const bookID = parseInt(lines[0], 10);
    const chapID = parseInt(lines[2], 10);
    const volID = parseInt(lines[1], 10);
    
    return { chapID, volID, bookID };
  } catch (error) {
    console.error(`Error reading Notify${notifyID}.txt:`, error);
    return null;
  }
}

async function readNotifyFile2n3(notifyID) {
  const blobName = `Noti${notifyID}.txt`;

  try {
    const blobClient = notifyContainer.getBlobClient(blobName); // Use the notifyContainer
    const response = await blobClient.download();
    const data = await streamToString(response.readableStreamBody);
    const lines = data.trim().split("\n");

    if (lines.length !== 1) {
      console.error(`Invalid file format for Noti${notifyID}.txt`);
      return null;
    }
    const bookID = parseInt(lines[0], 10);

    return { bookID };
  } catch (error) {
    console.error(`Error reading Notify${notifyID}.txt:`, error);
    return null;
  }
}

async function readNotifyFile3(notifyID) {
    const blobName = `Noti${notifyID}.txt`;
  
    try {
      const blobClient = notifyContainer.getBlobClient(blobName); // Use the notifyContainer
      const response = await blobClient.download();
      const data = await streamToString(response.readableStreamBody);
      const words = data.trim().split(/\s+/); // Split by whitespace characters
  
      if (words.length === 0) {
        console.error(`No words found in Noti${notifyID}.txt`);
        return null;
      }
      
      // Join the words array into a single string
      const result = words.join(' ');
  
      // You can access the result string as needed
    
  
      return result;
    } catch (error) {
      console.error(`Error reading Notify${notifyID}.txt:`, error);
      return null;
    }
  }

  async function readNotifyFile4(notifyID) {
    const blobName = `Noti${notifyID}.txt`;
  
    try {
      const blobClient = notifyContainer.getBlobClient(blobName); // Use the notifyContainer
      const response = await blobClient.download();
      const data = await streamToString(response.readableStreamBody);
      const lines = data.trim().split("\n");
  
      if (lines.length !== 2) {
        console.error(`Invalid file format for Noti${notifyID}.txt`);
        return null;
      }
      const userID = parseInt(lines[0], 10);
      const commentID = lines[1];
      
      
      return { userID, commentID };
    } catch (error) {
      console.error(`Error reading Notify${notifyID}.txt:`, error);
      return null;
    }
  }
  

  async function readCommentfile(commentID) {
    const blobName = `cmt${commentID}.docx`;
  
    try {
      const blobClient = commentContainer.getBlobClient(blobName); // Use the commentContainer
      const response = await blobClient.download();
  
      // Read the DOCX content into a buffer
      const buffer = await streamToBuffer(response.readableStreamBody);
  
      // Load the DOCX template using docxtemplater
      const zip = new PizZip(buffer);
      const doc = new Docxtemplater(zip);
  
      // Render the DOCX template to extract plain text
      doc.render();
  
      // Get the plain text content from the document
      const plainText = doc.getFullText();
  
      // You can access the plain text content as needed
     
  
      return plainText;
    } catch (error) {
      console.error(`Error reading cmt${commentID}.docx:`, error);
      return null;
    }
  }
  
  async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      readableStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      readableStream.on('error', reject);
    });
  }
async function readNotifyFile5(notifyID) {
    const blobName = `Noti${notifyID}.txt`;
  
    try {
      const blobClient = notifyContainer.getBlobClient(blobName); // Use the notifyContainer
      const response = await blobClient.download();
      const data = await streamToString(response.readableStreamBody);
      const lines = data.trim().split("\n");
  
      if (lines.length !== 1) {
        console.error(`Invalid file format for Noti${notifyID}.txt`);
        return null;
      }
      const bookID = parseInt(lines[0], 10);
  
      return { bookID };
    } catch (error) {
      console.error(`Error reading Notify${notifyID}.txt:`, error);
      return null;
    }
  }

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

exports.deleteNoti = async (req, res) => {

  try {
    const { chap_id } = req.body; // Retrieve chap_id from request body
  

    await notifyofusers.deleteOne({ _id: chap_id }); // Delete the reading history entry
    //    const read = await ReadingHistory.findOne({ _id: chap_id })
    // console.log(read);

    return res.status(200).send("Notification entry deleted successfully.");
  } catch (error) {
    console.error("Error deletingNotification:", error);
    return res.status(500).send("Internal server error.");
  }
};
