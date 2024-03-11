const {Router} = require('express')
const manageControllers = require('../controllers/manageControllers')
const { requirePermission } = require('../middleware/authMiddleware')
const Account = require('../models/Account')
const router = Router()
const Book = require('../models/Book');

const { notifyContainer} = require('../middleware/database')

const Notify = require('../models/Notify')

const NotifyOfUser = require('../models/NotifyOfUser')

function generateNotifyID() {
  return Notify.find({}).select('notifyID').sort({'notifyID': -1}).limit(1) 
}

async function saveFileToAzure(fileName, content, container) {
  const blobClient = container.getBlockBlobClient(fileName);
  await blobClient.upload(content, Buffer.byteLength(content));
}
router.get('/manage', requirePermission(1), manageControllers.getBooks);
router.post('/process-checkboxes', async (req, res) => {
    const selectedBookIDs = req.body.selectedBookIDs;
    let isSuccess = true;

  try {
    for (const bookData of selectedBookIDs) {
      const bookID = bookData.bookID;
      const isPending = bookData.isPending;

      // Tìm sách theo bookID trong cơ sở dữ liệu
      const book = await Book.findOne({ bookID: bookID });

      // Nếu tìm thấy sách và isPending khác 0, thực hiện cập nhật
      if (book && isPending != "0"  && book.isPending == isPending) {
        book.isPending = "0"; // Đặt isPending = 0
        await book.save(); // Lưu lại vào cơ sở dữ liệu

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
      }
      else {
        isSuccess = false; // Ghi nhận có lỗi xảy ra
        break; // Dừng vòng lặp nếu có lỗi
      }
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
router.post('/delete-books', async (req, res) => {
    const selectedBookIDs = req.body.selectedBookIDs;
    //console.log(selectedBookIDs)
    let isSuccess2 = true;
    try {
      for (const bookData of selectedBookIDs) {
        // Tìm và xóa sách có bookID tương ứng
        const bookID = bookData.bookID;
        const status = bookData.status;
        const book = await Book.findOne({ bookID: bookID });

      // Nếu tìm thấy sách và isPending khác 0, thực hiện cập nhật
        if (book && status != "3" && book.status == status) {
        book.status = "3"; // Đặt isPending = 0
        await book.save(); // Lưu lại vào cơ sở dữ liệu
      }
      else {
        isSuccess2 = false; // Ghi nhận có lỗi xảy ra
        break; // Dừng vòng lặp nếu có lỗi
      }
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