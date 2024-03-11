const Account = require('../models/Account')
const Book = require('../models/Book')
const BookGenre = require('../models/BookGenre')
const Volume = require('../models/Volume')
const Chapter = require('../models/Chapter')
const Genre = require('../models/Genre')
const Notify = require('../models/Notify')
const NotifyOfUser = require('../models/NotifyOfUser')
const jwt = require('jsonwebtoken')
const {bookcoverContainer, bookContainer, notifyContainer} = require('../middleware/database')

module.exports.upload_get = (req, res) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, 'information of user', async (err, decodedToken) => {
            if (err) {
                console.log(err.message);
            }
            else {
                user = await Account.findById(decodedToken.id);
                let books = []
      
                const testBook = await Book.find({author: user.userID, isPending: 0, status: { $ne: 3 }}).sort({bookID: 1})
                for (const demobook of testBook) {
                  demobook.volumes = await Volume.find({ bookID: demobook.bookID, isDeleted: 0});
                
                  for (const demovol of demobook.volumes) {
                    demovol.chapters = await Chapter.find({ bookID: demobook.bookID, volID: demovol.volID, $or: [
                      { isPending: 0 },
                      { isPending: 2 }
                    ] }).sort({chapID: 1});
                  }
                }
                const genres = await Genre.find({}).sort('genreName');
                res.render('upload', {books: testBook, genres})
            }
        })
    }
}

module.exports.upload_post = async (req, res) => {
  try {
    const bookID = req.body.bookID
    const volData = await Volume.find({bookID: bookID});
    // console.log(volData)
    res.status(200).json({data: volData});
  }
  catch (err) {
      console.log(err)
      // const errors = handleErrors(err);
      res.status(400).json({err})
  }
}

async function saveFileToAzure(fileName, content, container) {
  const blobClient = container.getBlockBlobClient(fileName);
  await blobClient.upload(content, Buffer.byteLength(content));
}

function getUserIDWithToken(req) {
  const token = req.cookies.jwt;
  const decodedToken = jwt.verify(token, 'information of user')
  return Account.findById(decodedToken.id).select('userID')
}

function generateBookID() {
  return Book.find({}).select('bookID').sort({'bookID': -1}).limit(1) 
}
function generateVolID(bookID) {
  return Volume.find({bookID: bookID}).select('volID').sort({'volID': -1}).limit(1) 
}
function generateChapID(bookID, volID) {
  return Chapter.find({bookID: bookID, volID: volID}).select('chapID').sort({'chapID': -1}).limit(1) 
}
function generateNotifyID() {
  return Notify.find({}).select('notifyID').sort({'notifyID': -1}).limit(1) 
}

async function streamToText(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}

// BOOK
module.exports.addBook_post = async (req, res) => {
  try {
    // console.log(req.body)
    let {title, authorName, genres, status, summary, note} = req.body
    if (genres) genres = genres.map(str => {
      return parseInt(str, 10);
    });
    /// Get author ID
    let author = await getUserIDWithToken(req)
    author = author.userID

    // Generate bookCover name
    let coverImg = "defaultBook.jpg"

    // Generate bookID
    let bookID = await generateBookID()
    bookID = bookID[0].bookID + 1

    // Generate summary and note
    let summaryName = "summary" + bookID + ".txt"
    let noteName = "note" + bookID + ".txt"
    saveFileToAzure(`Book${bookID}/${summaryName}`, summary, bookContainer)
    saveFileToAzure(`Book${bookID}/${noteName}`, note, bookContainer)

    // Save image
    if (req.file) {
      try {
        coverImg = "bookCover" + bookID + ".jpg"
        blobClient = bookcoverContainer.getBlockBlobClient(coverImg);
        await blobClient.uploadData(req.file.buffer, req.file.buffer.length);
        // console.log(`Image uploaded to Azure Blob Storage.`);
        // return res.status(200).json({ message: 'Image uploaded successfully' });
      } catch (error) {
        console.error('Error uploading image:', error);
        // return res.status(500).json({ error: 'Internal server error' });
      }
    }

    // Save to MongoDB
    await Book.create({
      bookID: bookID,
      title: title,
      author: author,
      note: noteName,
      summary: summaryName,
      coverImg: coverImg,
      status: status,
      authorName: authorName,
      publishDate: new Date(),
    })
    if (genres) genres.forEach(async element  => {
      await BookGenre.create({
          bookID: bookID,
          genreID: element,
      })
    });

      notifyID = await generateNotifyID()
      notifyID = notifyID[0].notifyID + 1
      notiFile = `Noti${notifyID}.txt`

      // Create Notify
      await Notify.create({notifyID: notifyID, typeID: 5, content: notiFile})

      // Create NotifyOfUsers
      listUser = await Account.find({permission: {$ne: 0}}).select('userID')
      listUser = listUser.map(Account => Account.userID)
      for (const UID of listUser) {
        await NotifyOfUser.create({notifyID: notifyID, userID: UID})
      }
      notiContent = `${bookID}`
      const path = `${notiFile}`
      saveFileToAzure(path, notiContent, notifyContainer)

    
    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the book.' });
  }
}

module.exports.reviewBook_post = async (req, res) => {
  try {
    const bookID = req.body.bookID
    const bookData = await Book.findById(bookID);
    const bookGenres = await BookGenre.find({bookID: bookData.bookID})
    
    const summaryFile = bookContainer.getBlobClient(`Book${bookData.bookID}/${bookData.summary}`)
    const noteFile = bookContainer.getBlobClient(`Book${bookData.bookID}/${bookData.note}`)

    try {
      const resSummary = await summaryFile.download();
      const contentSummary = await streamToText(resSummary.readableStreamBody);
      bookData.summary = contentSummary
    } catch (error) {
      bookData.summary = ''
      // console.error("Error retrieving blob content:", error);
    }

    try {
      const resNote = await noteFile.download();
      const contentNote = await streamToText(resNote.readableStreamBody);
      bookData.note = contentNote
    } catch (error) {
      bookData.note = ''
      // console.error("Error retrieving blob content:", error);
    }

    res.status(200).json({book: bookData, genre: bookGenres});
  }
  catch (err) {
      console.log(err)
      res.status(400).json({err})
  }
}

module.exports.updateBook_post = async (req, res) => {
  try {
    // console.log(req.body)
    let {bookID, title, authorName, genres, status, summary, note} = req.body
    //Update Book
    await Book.findOneAndUpdate(
      {bookID: bookID,},
      {title: title, authorName: authorName, status: status,}
    )

    // Update Genres
    if (genres) genres = genres.map(str => {
      return parseInt(str, 10);
    });

    await BookGenre.deleteMany({bookID: bookID})
    if (genres) genres.forEach(async element  => {
      await BookGenre.create({
          bookID: bookID,
          genreID: element,
      })
    });


    // Generate summary and note
    let summaryName = "summary" + bookID + ".txt"
    let noteName = "note" + bookID + ".txt"
    saveFileToAzure(`Book${bookID}/${summaryName}`, summary, bookContainer)
    saveFileToAzure(`Book${bookID}/${noteName}`, note, bookContainer)
    await Book.findOneAndUpdate(
      {bookID: bookID,},
      {summary: summaryName, note: noteName,},
    )

    // Save image
    if (req.file) {
      try {
        coverImg = "bookCover" + bookID + ".jpg"
        await Book.findOneAndUpdate(
          {bookID: bookID,},
          {coverImg: coverImg,},
        )
        blobClient = bookcoverContainer.getBlockBlobClient(coverImg);
        await blobClient.uploadData(req.file.buffer, req.file.buffer.length);
        // console.log(`Image uploaded to Azure Blob Storage.`);
        // return res.status(200).json({ message: 'Image uploaded successfully' });
      } catch (error) {
        console.error('Error uploading image:', error);
        // return res.status(500).json({ error: 'Internal server error' });
      }
    }

    
    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the book.' });
  }
}

module.exports.deleteBook_post = async (req, res) => {
  try {
    bookID = req.body.bookID
    bookID = parseInt(bookID)
    await Book.findOneAndUpdate({bookID: bookID}, {status: 3})
    await Volume.updateMany({bookID: bookID}, {isDeleted: 1})
    await Chapter.updateMany({bookID: bookID}, {isPending: 3})

    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the book.' });
  }
}

// VOLUME
module.exports.addVolume_post = async (req, res) => {
  try {
    // console.log(req.body)
    let {bookID, volName} = req.body
    bookID = parseInt(bookID)
    // Generate volID
    let volID = await generateVolID(bookID)
    if (volID.length) {
      volID = volID[0].volID + 1
    }
    else {
      volID = 1
    }

    // Save to MongoDB
    await Volume.create({
      bookID: bookID,
      volID: volID,
      volName: volName,
    })
    
    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the volume.' });
  }
}

module.exports.reviewVolume_post = async (req, res) => {
  try {
    const volID = req.body.volID
    const volData = await Volume.findById(volID);
    const bookData = await Book.find({bookID: volData.bookID})
    // console.log(bookData)
    res.status(200).json({vol: volData, book: bookData});
  }
  catch (err) {
      console.log(err)
      // const errors = handleErrors(err);
      res.status(400).json({err})
  }
}

module.exports.updateVolume_post = async (req, res) => {
  try {
    let {volObjID, volName} = req.body
    
    // update
    await Volume.findByIdAndUpdate({_id: volObjID}, {volName: volName})
    
    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the volume.' });
  }
}

module.exports.deleteVolume_post = async (req, res) => {
  try {
    bookID = req.body.bookID
    volObjID = req.body.volObjID
    await Volume.updateOne({_id: volObjID}, {isDeleted: 1})
    volID = await Volume.findById({_id: volObjID})
    volID = volID.volID
    await Chapter.updateMany({bookID: bookID, volID: volID}, {isPending: 3})

    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the volume.' });
  }
}

// CHAPTER
module.exports.addChapter_post = async (req, res) => {
  try {
    // console.log(req.body)
    let {bookID, volID, chapName, chapContent} = req.body
    bookID = parseInt(bookID)
    volID = parseInt(volID)

    // Generate bookID
    let chapID = await generateChapID(bookID, volID)
    if (chapID.length) {
      chapID = chapID[0].chapID + 1
    }
    else {
      chapID = 1
    }
    

    // Generate summary and note
    let chapFile = "chap" + chapID + ".txt"
    const path = `Book${bookID}/Volume${volID}/${chapFile}`
    // console.log(chapFile)
    // console.log(path)
    saveFileToAzure(path, chapContent, bookContainer)

    // Save to MongoDB
    await Chapter.create({
      bookID: bookID,
      volID: volID,
      chapID: chapID,
      chapName: chapName,
      contentfile: chapFile,
      publishDate: new Date(),
    })
    
    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the chapter.' });
  }
}

module.exports.reviewChapter_post = async (req, res) => {
  try {
    const chapID = req.body.chapID
    const chapData = await Chapter.findById(chapID);
    const bookData = await Book.find({bookID: chapData.bookID})
    const volData = await Volume.find({bookID: chapData.bookID, volID: chapData.volID})

    const path = `Book${bookData[0].bookID}/Volume${volData[0].volID}/${chapData.contentfile}`
    const updateFilePath = `Book${bookData[0].bookID}/Volume${volData[0].volID}/${chapData.updatefile}`
    const chapFile = bookContainer.getBlobClient(path)
    const updateFile = bookContainer.getBlobClient(updateFilePath)

    try {
      const resChap = await chapFile.download();
      const chapContent = await streamToText(resChap.readableStreamBody);
      chapData.contentfile = chapContent

    } catch (error) {
      chapData.contentfile = ''
      // console.error("Error retrieving blob content:", error);
    }

    try {
      const resUpdate = await updateFile.download();
      const updateContent = await streamToText(resUpdate.readableStreamBody);
      chapData.updatefile = updateContent
    } catch (error) {
      chapData.updatefile = ''
      // console.error("Error retrieving blob content:", error);
    }

    // console.log(chapData.contentfile)
    res.status(200).json({book: bookData, vol: volData, chap: chapData});
  }
  catch (err) {
      console.log(err)
      // const errors = handleErrors(err);
      res.status(400).json({err})
  }
}

module.exports.updateChapter_post = async (req, res) => {
  try {
    // console.log(req.body)
    let {chapObjID, chapName, chapContent} = req.body

    // update
    chap = await Chapter.findByIdAndUpdate({_id: chapObjID}, {chapName: chapName, isPending: 2}) // doi thanh 2

    const newfile = "v2" + chap.contentfile // lay cai nay
    // const newfile = chap.contentfile // xoa cai nay
    await Chapter.updateOne({_id: chapObjID,}, {$set: {updatefile: newfile}}, {upsert: true})

    // Generate summary and note
    const path = `Book${chap.bookID}/Volume${chap.volID}/${newfile}`
    saveFileToAzure(path, chapContent, bookContainer)
    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the chapter.' });
  }
}

module.exports.deleteChapter_post = async (req, res) => {
  try {
    chapObjID = req.body.chapObjID
    await Chapter.updateOne({_id: chapObjID}, {isPending: 3})

    res.status(200).json({check: 'ok'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the chapter.' });
  }
}

