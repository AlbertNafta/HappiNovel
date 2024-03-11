const {Router} = require('express')
const manageCommentControllers = require('../controllers/manageCommentControllers')
const { requirePermission } = require('../middleware/authMiddleware')

const router = Router()
const Comment = require('../models/Comment');

router.get('/manageComment', requirePermission(1), manageCommentControllers.getComments);
router.post('/process-pass', async (req, res) => {
    const selectedCommentIDs = req.body.selectedCommentIDs;
    let isSuccess = true;

  try {
    for (const commentData of selectedCommentIDs) {
      const bookID = commentData.bookID;
      const commentID = commentData.commentID;
      const status = commentData.status;
      // Tìm sách theo bookID trong cơ sở dữ liệu
      const comment = await Comment.findOne({ commentID: commentID });

      // Nếu tìm thấy sách và isPending khác 0, thực hiện cập nhật
      if (comment && status !== "0"  && comment.status == status) {
        comment.status = "0"; // Đặt isPending = 0
        await comment.save(); // Lưu lại vào cơ sở dữ liệu
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
router.post('/delete-comments', async (req, res) => {
    const selectedCommentIDs = req.body.selectedCommentIDs;
    //console.log(selectedCommentIDs)
    let isSuccess2 = true;
    try {
      for (const commentData of selectedCommentIDs) {
    
        const bookID = commentData.bookID;
        const commentID = commentData.commentID;
        const status = commentData.status;
       
        const comment = await Comment.findOne({ commentID: commentID });

      // Nếu tìm thấy sách và isPending khác 0, thực hiện cập nhật
        if (comment && status !== "0"  && comment.status == status) {
            await comment.deleteOne(); // Đặt isPending = 0
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