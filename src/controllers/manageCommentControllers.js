const Comment = require('../models/Comment');

const getComments = async (req, res) => {
    try {
        const Comments = await Comment.aggregate([
            {
              $lookup: {
                from: "books",
                localField: "bookID",
                foreignField: "bookID",
                as: "bookInfo"
              }
            },
            {
              $lookup: {
                from: "accounts",
                localField: "userID",
                foreignField: "userID",
                as: "userInfo"
              }
            },
            {
              $project: {
                commentID: 1,
                bookID: 1,
                userID: 1,
                contentfile: 1,
                status:1,
                bookTitle: { $arrayElemAt: ["$bookInfo.title", 0] },
                bookauthor: { $arrayElemAt: ["$bookInfo.authorName", 0] }, // Lấy giá trị title từ mảng bookInfo
                username: { $arrayElemAt: ["$userInfo.username", 0] } // Lấy giá trị username từ mảng userInfo
              }
            },
            {
              $sort: { commentID: 1 } // Sắp xếp theo bookID tăng dần (1) hoặc giảm dần (-1)
            }
          ]);
        res.render('Comment_manage', { Comments });
    } catch (err) {
        console.log(err);
        return res.status(500).render('error500');
    }
};

module.exports = {
    getComments
};