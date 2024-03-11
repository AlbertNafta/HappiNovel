const Account = require('../models/Account');

const getUsers = async (req, res) => {
    try {
        const Accounts = await Account.find().sort({ userID: 1 });
        const user = res.locals.user;
        // const test = {
        //     userID: user.userID,
        //     permission: user.permission
        //   };
    // Render trang /manageUser với danh sách các tài khoản
        //res.render('User_management', { Accounts,test });
        res.render('User_management', { Accounts,user });
    } catch (err) {
        console.log(err);
        return res.status(500).render('error500');
    }
};

module.exports = {
    getUsers
};