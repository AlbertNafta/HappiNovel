const {Router} = require('express')
const managePendingControllers = require('../controllers/managePendingControllers')
const jwt = require('jsonwebtoken')
const { requirePermission } = require('../middleware/authMiddleware')
const { bookContainer,notifyContainer} = require('../middleware/database')
const router = Router()
const Chapter = require('../models/Chapter');
const Book = require('../models/Book');
const BookGenre = require('../models/BookGenre');
const Notify = require('../models/Notify')

const NotifyOfUser = require('../models/NotifyOfUser')

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
async function saveFileToAzure(fileName, content, container) {
    const blobClient = container.getBlockBlobClient(fileName);
    await blobClient.upload(content, Buffer.byteLength(content));
}
router.get('/managePending', requirePermission(1), managePendingControllers.getBooks);
router.post('/pending-pass', async (req, res) => {
    const selectedIDs = req.body.selectedIDs;
    let isSuccess = true;
    //console.log(selectedIDs)
  try {
    for (const bookData of selectedIDs) {
      const bookID = bookData.bookID;
      const chapID = bookData.chapID;
      const volID = bookData.volID;
      const isPending = bookData.isPending;
      const bookPending = bookData.bookPending;
      const contentfile = bookData.contentfile;
      const updatefile = bookData.updatefile;
      if (isPending == "1") {
        if (chapID != "") {
              const chap = await Chapter.findOne({ bookID: bookID,chapID: chapID,volID: volID });
              if (chap && chap.isPending == isPending) {
                chap.isPending = 0;
                await chap.save();
                } else
                {
                    isSuccess = false; // Ghi nhận có lỗi xảy ra
                    break;
                }

          } else {
              const book = await Book.findOne({ bookID: bookID });
              if (book && book.isPending == isPending) {
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
              } else {
                isSuccess = false; // Ghi nhận có lỗi xảy ra
                break;
              }
            
          }
      } else if (isPending == "2") {
        const chap = await Chapter.findOne({bookID: bookID,chapID: chapID,volID: volID });
        if (chap && chap.isPending == isPending) {
           chap.isPending = 0;
           chap.updatefile = "";
           await chap.save();
           const updatePath = `Book${bookID}/Volume${volID}/${updatefile}`;
           //console.log(updatePath)
           const contentPath = `Book${bookID}/Volume${volID}/${contentfile}`;
           //console.log(contentPath)
           // Step 1: Read content of updatefile
           const updateBlobClient = bookContainer.getBlobClient(updatePath);
           //console.log(updateBlobClient)
           const updateStream = await updateBlobClient.download();
           const updateContent = await streamToText(updateStream.readableStreamBody);
   
           await saveFileToAzure(contentPath, updateContent, bookContainer);
           await updateBlobClient.delete();
        } else {
          
              isSuccess = false; // Ghi nhận có lỗi xảy ra
              break;
        }
        

      }  
      // Nếu tìm thấy sách và isPending khác 0, thực hiện cập nhật
      
    }
    if (isSuccess) {
      // Gửi thông báo thành công
      res.send('Done');
    } else {
      // Gửi thông báo lỗi
      res.send('Error');
    }

  } catch (err) {
    // Xử lý lỗi nếu có
    console.log(err);
    res.status(500).send('An error occurred while processing data.');
  }
});
router.post('/delete-pendings', async (req, res) => {
  const selectedIDs = req.body.selectedIDs;
  let isSuccess2 = true;
  //console.log(selectedIDs)
try {
  for (const bookData of selectedIDs) {
    const bookID = bookData.bookID;
    const chapID = bookData.chapID;
    const volID = bookData.volID;
    const isPending = bookData.isPending;
    const bookPending = bookData.bookPending;
    const contentfile = bookData.contentfile;
    const updatefile = bookData.updatefile;
    if (isPending == "1") {
      if (chapID != "") {
        const chap = await Chapter.findOne({ bookID: bookID,chapID: chapID,volID: volID });
        if (
            chap && chap.isPending == isPending && isPending == "1" ) {
            const chappath = `Book${bookID}/Volume${volID}/${contentfile}`;
            const deleteBlobClient = bookContainer.getBlobClient(chappath);
            await deleteBlobClient.delete();
            await chap.deleteOne()
          } 
          else if (chap && chap.isPending == isPending && isPending == "2")
          {
            const chappath = `Book${bookID}/Volume${volID}/${updatefile}`;
            const deleteBlobClient = bookContainer.getBlobClient(chappath);
            await deleteBlobClient.delete();
            chap.isPending = 0;
            chap.updatefile = "";
            await chap.save();
          }
          else
          {
              isSuccess2 = false; // Ghi nhận có lỗi xảy ra
              break;
          }
    } else {
        const book = await Book.findOne({ bookID: bookID });
        if (book && book.isPending == isPending) {
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
        } else {
          isSuccess2 = false; // Ghi nhận có lỗi xảy ra
          break;
        }
      
    }
    } else if (isPending == "2") {
      const chap = await Chapter.findOne({ bookID: bookID,chapID: chapID,volID: volID });
      if (chap && chap.isPending == isPending && isPending == "2" ) {
        const chappath = `Book${bookID}/Volume${volID}/${updatefile}`;
        const deleteBlobClient = bookContainer.getBlobClient(chappath);
        await deleteBlobClient.delete();
        chap.updatefile = "";
        chap.isPending = 0;
        await chap.save();
      }
      else {
        isSuccess2 = false; // Ghi nhận có lỗi xảy ra
        break;
      }
    
      } else {
        
            isSuccess2 = false; // Ghi nhận có lỗi xảy ra
            break;
      }
      

     
    // Nếu tìm thấy sách và isPending khác 0, thực hiện cập nhật
    
  }
    if (isSuccess2) {
      // Gửi thông báo thành công
      res.send('Done');
    } else {
      // Gửi thông báo lỗi
      res.send('Error');
    }

    } catch (err) {
      // Xử lý lỗi nếu có
      console.log(err);
      res.status(500).send('An error occurred while deleting books.');
    }
  });
module.exports = router;