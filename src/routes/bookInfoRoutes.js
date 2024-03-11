const {Router} = require('express');
const router = Router()

const bookInfoControllers = require('../controllers/bookInfoControllers');

// Define a route to handle book information
router.get('/:bookID/:chapID', bookInfoControllers.reading);
router.get('/:id', bookInfoControllers.bookInfo_get);
router.post('/:id/bookmark', bookInfoControllers.bookmark);
router.post('/:id/rating', bookInfoControllers.rating);
router.post('/:id/addComment', bookInfoControllers.addComment);
router.delete('/:id/deleteComment', bookInfoControllers.deleteComment);
router.post('/:id/reportComment', bookInfoControllers.reportComment);
router.post('/:id/banUser', bookInfoControllers.banUser);

module.exports = router;
