const express = require('express');
const readinghistoryController = require('../controllers/readingHistoryController');
const router = express.Router();

router.get('/readinghistory', readinghistoryController.readinghistory);
router.delete('/readinghistory/delete', readinghistoryController.deleteHis); // Use DELETE method here

module.exports = router;
