const {Router} = require('express')
const bookMarkController = require('../controllers/bookMarkController');


const router = Router()

router.get('/bookmark', bookMarkController.bookmark);

module.exports = router;