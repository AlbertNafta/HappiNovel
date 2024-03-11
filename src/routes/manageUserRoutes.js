const {Router} = require('express')
const manageUserControllers = require('../controllers/manageUserControllers')
const { requirePermission } = require('../middleware/authMiddleware')

const router = Router()
const Account = require('../models/Account');

router.get('/manageUser', requirePermission(1), manageUserControllers.getUsers);
router.post('/process-usercheckboxes', async (req, res) => {
    const selectedAccountIDs = req.body.selectedAccountIDs;
    //console.log(selectedAccountIDs)
    let isSuccess = true;

  try {
    for (const accountData of selectedAccountIDs) {
      const userID = accountData.userID;
      const permission = accountData.permission;

      // Tìm sách theo bookID trong cơ sở dữ liệu
      const account = await Account.findOne({ userID: userID }).select('userID permission');
        //console.log(account)
        const filter = { userID: userID };
      if (account && permission !== "1" && permission == account.permission ) {
          const update = { permission: 1 };
          await Account.updateOne(filter, update);
        } else if (account && permission !== "0" && permission == account.permission) {
          const update2 = { permission: 0 };
          await Account.updateOne(filter, update2);
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
router.post('/banunban-box', async (req, res) => {
    const selectedAccountIDs = req.body.selectedAccountIDs;
    let isSuccess2 = true;
    try {
      for (const accountData of selectedAccountIDs) {
        // Tìm và xóa sách có bookID tương ứng
        const userID = accountData.userID;
        //console.log(userID);
        const status = accountData.status;
        //console.log(status)
        const account = await Account.findOne({ userID: userID }).select('userID status');
        //console.log(account)
        const filter = { userID: userID };
      if (account && status !== "1" && status == account.status) {
          const update = { status: 1 };
          await Account.updateOne(filter, update);
      } else if (account && status !== "0" && status == account.status) {
          const update2 = { status: 0 };
          await Account.updateOne(filter, update2);
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