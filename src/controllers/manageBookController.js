const Account = require('../models/Account')
const Book = require('../models/Book')
const Genre = require('../models/Genre')
const BookGenre = require('../models/BookGenre')
const Volume = require('../models/Volume')
const Chapter = require('../models/Chapter')

const cheerio = require('cheerio');
const jwt = require('jsonwebtoken')
const {bookcoverContainer, bookContainer, avatarContainer,notifyContainer} = require('../middleware/database')


const Notify = require('../models/Notify')

const NotifyOfUser = require('../models/NotifyOfUser')

function generateNotifyID() {
  return Notify.find({}).select('notifyID').sort({'notifyID': -1}).limit(1) 
}
async function saveFileToAzure(fileName, content, container) {
    const blobClient = container.getBlockBlobClient(fileName);
    await blobClient.upload(content, Buffer.byteLength(content));
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

async function countWordsInHtml(htmlString) {
    const $ = cheerio.load(htmlString);
    const textContent = $('body').text(); // Extract text content from the <body> element
  
    // Split the text content into words using space as a delimiter
    const words = textContent.split(/\s+/);
  
    // Filter out any empty strings
    const nonEmptyWords = words.filter(word => word.trim() !== '');
  
    return nonEmptyWords.length;
}

module.exports.viewBook = async (req, res) => {
    try {
        const bookID = req.params.id;
  
        let book = await Book.findOne({bookID: bookID,})
        if (!book) {
          return res.status(404).render('404');
        }
  
        book.volumes = await Volume.find({ bookID }).sort({volID: 1})
  
        book.volumes.forEach(async element => {
          element.chapters = await Chapter.find({bookID: bookID, volID: element.volID}).sort({chapID: 1});
        })
    
        const bookGenres = await BookGenre.find({ bookID })
        const genresID = bookGenres.map(BookGenre => BookGenre.genreID)
        const genresOfBook = await Genre.find({genreID: {$in: genresID}})
  
        let author = await Account.findOne({userID: book.author})
  
        const summaryFile = bookContainer.getBlobClient(`Book${bookID}/${book.summary}`)
        const noteFile = bookContainer.getBlobClient(`Book${bookID}/${book.note}`)
  
        try {
          const resSummary = await summaryFile.download();
          const contentSummary = await streamToText(resSummary.readableStreamBody);
          book.summary = contentSummary
        } catch (error) {
          book.summary = ''
        }
  
        try {
          const resNote = await noteFile.download();
          const contentNote = await streamToText(resNote.readableStreamBody);
          book.note = contentNote
        } catch (error) {
          book.note = ''
        }
  
        author.avatarURL = avatarContainer.getBlobClient(author.avatarURL).url
        book.coverImg = bookcoverContainer.getBlobClient(book.coverImg).url
  
        
        const token = req.cookies.jwt;
        let curUser
        if (token) {
          try {
            const decodedToken = await new Promise((resolve, reject) => {
                jwt.verify(token, 'information of user', (err, decoded) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(decoded);
                    }
                });
            });
    
            const findUser = await Account.findById(decodedToken.id)
            curUser = findUser;
        } catch (error) {
            console.error('Token verification error:', error);
        }
        }
        else {
          curUser = new Account
          curUser.permission = 3
        }
  
        curUser.avatarURL = avatarContainer.getBlobClient(curUser.avatarURL).url
  
        res.render('manageBook', {book, genresOfBook, author, curUser}); // Pass genres to the view
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

module.exports.viewChapter = async (req, res) => {
    try {
        bookID = Number(req.params.bookID)
        chapObjID = req.params.chapID
        
    
        let curChap = await Chapter.findById(chapObjID)
        let curVol = await Volume.findOne({bookID: bookID, volID: curChap.volID})
        let nextChap = ((await Chapter.findOne(
            {bookID: bookID, volID: curChap.volID, chapID: curChap.chapID + 1}))
            || (await Chapter.findOne(
            {bookID: bookID, volID: curChap.volID + 1, chapID: 1})))
            || ''
        
        let nextVol = ''
        if (nextChap) nextVol = await Volume.findOne({bookID: bookID, volID: nextChap.volID})
        
        let prevChap = ''
        let prevVol = ''
        if (curChap.chapID != 1) {
            prevChap = await Chapter.findOne({bookID: bookID, volID: curChap.volID, chapID: curChap.chapID - 1})
            prevVol = curVol
            // console.log(prevChap)
        }
        else if(curChap.chapID == 1 && curChap.volID != 1) {
            prevVol = await Volume.findOne({bookID: bookID, volID: curChap.volID - 1})
            prevChap = await Chapter.findOne({bookID: bookID, volID: curChap.volID - 1}).sort({chapID: -1}).lean().exec()
            // console.log(prevChap)
        }
        // console.log(prevChap, curChap, nextChap)
        // console.log(prevVol, curVol, nextVol)
    
        if (curChap.isPending == 0) {
            chapFile = bookContainer.getBlobClient(`Book${bookID}/Volume${curChap.volID}/${curChap.contentfile}`)
        } else if (curChap.isPending == 2) {
            chapFile = bookContainer.getBlobClient(`Book${bookID}/Volume${curChap.volID}/${curChap.updatefile}`)
        }
    
        try {
            const resChap = await chapFile.download();
            const contentChap = await streamToText(resChap.readableStreamBody);
            curChap.contentfile = contentChap
        } catch (error) {
            curChap.contentfile = ''
        }
    
        const wordCount = await countWordsInHtml(curChap.contentfile)
        isPrevChap = true
        isNextChap = true
        if (prevChap == '') isPrevChap = false
        if (nextChap == '') isNextChap = false
    
        res.render('reading', {curVol, prevChap, curChap, nextChap, wordCount, isPrevChap, isNextChap})
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.approveBook = async (req, res) => {
    try {
        bookID = req.body.bookID
        const book = await Book.findOne({ bookID: bookID })
        if (book && book.isPending == "1") {
            book.isPending = 0;
            await book.save();
            notifyID = await generateNotifyID()
        notifyID = notifyID[0].notifyID + 1
        notiFile = `Noti${notifyID}.txt`

        // Create Notify
        await Notify.create({notifyID: notifyID, typeID: 2, content: notiFile})

      // Create NotifyOfUsers
        
        await NotifyOfUser.create({notifyID: notifyID, userID: book.author})
      
        notiContent = `${book.bookID}`

        const pathne = `${notiFile}`
        saveFileToAzure(pathne, notiContent, notifyContainer)
        res.status(200).json('ok');
          } 
        else {
            res.status(400).json('error');
          }
        
    }
    catch (err) {
        console.log(err)
        res.status(400).json({err})
    }
}

module.exports.rejectBook = async (req, res) => {
    try {
        bookID = req.body.bookID
        const book = await Book.findOne({ bookID: bookID });
        if (book && book.isPending == "1") {

            notifyID = await generateNotifyID()
        notifyID = notifyID[0].notifyID + 1
        notiFile = `Noti${notifyID}.txt`

        // Create Notify
        await Notify.create({notifyID: notifyID, typeID: 3, content: notiFile})

      // Create NotifyOfUsers
        
        await NotifyOfUser.create({notifyID: notifyID, userID: book.author})
      
        notiContent = `${book.title}`

        const pathne = `${notiFile}`
        saveFileToAzure(pathne, notiContent, notifyContainer)
        await BookGenre.deleteMany({ bookID: bookID });
        await Chapter.deleteMany({ bookID: bookID });
        await book.deleteOne();
        res.status(200).json('ok');
        } else {
        res.status(400).json('error');
        }

        
    }
    catch (err) {
        console.log(err)
        res.status(400).json({err})
    }
}

module.exports.approveChap = async (req, res) => {
    try {
        chapList = req.body.objIDList
        //console.log(chapList);
        let chek = true;
        for (const id of chapList) {
        const chap = await Chapter.findById( id)
        if( chap && chap.isPending == "1")
        {
            chap.isPending = 0;
            await chap.save();
        }
        else if (chap && chap.isPending == "2")
        {
            
          
           const updatePath = `Book${chap.bookID}/Volume${chap.volID}/${chap.updatefile}`;
           //console.log(updatePath)
           const contentPath = `Book${chap.bookID}/Volume${chap.volID}/${chap.contentfile}`;
           //console.log(contentPath)
           // Step 1: Read content of updatefile
           const updateBlobClient = bookContainer.getBlobClient(updatePath);
           //console.log(updateBlobClient)
           const updateStream = await updateBlobClient.download();
           const updateContent = await streamToText(updateStream.readableStreamBody);
   
           await saveFileToAzure(contentPath, updateContent, bookContainer);
           await updateBlobClient.delete();
           chap.isPending = 0;
           chap.updatefile = "";
           await chap.save();
        }
        else
        {
            chek = false;
            
            break;
        }
        }
        if (chek)
        {
            res.status(200).json('ok');
        }
        else
        {
            res.status(400).json('error');
        }
        
    }
    catch (err) {
        console.log(err)
        res.status(400).json({err})
    }
}

module.exports.rejectChap = async (req, res) => {
    try {
        chapList = req.body.objIDList
        let chek2 = true;
        for (const id of chapList) {
            const chap = await Chapter.findById( id)
            if( chap && chap.isPending == "1")
        {
            const chappath = `Book${chap.bookID}/Volume${chap.volID}/${chap.contentfile}`;
            const deleteBlobClient = bookContainer.getBlobClient(chappath);
            await deleteBlobClient.delete();
            await chap.deleteOne()
        }
        else if (chap && chap.isPending == "2")
        {
            
            const chappath = `Book${chap.bookID}/Volume${chap.volID}/${chap.updatefile}`;
            const deleteBlobClient = bookContainer.getBlobClient(chappath);
            await deleteBlobClient.delete();
            chap.updatefile = "";
            chap.isPending = 0;
            await chap.save();
        }
        else
        {
            chek2 = false;
            
            break;
        }
        }
        if(chek2)
        {
            res.status(200).json('ok');
        }
        else
        {
            res.status(400).json('error');
        }
        
    }
    catch (err) {
        console.log(err)
        res.status(400).json({err})
    }
}