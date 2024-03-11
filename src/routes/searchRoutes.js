const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Route to display the genres on the homepage
router.get('/filter', searchController.getSearchResult);

module.exports = router;