const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Route to display the books on the homepage
router.get('/', bookController.getBooksAndReadingHistory);

module.exports = router;