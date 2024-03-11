const express = require('express');
const profileController = require('../controllers/profileController');
const router = express.Router();
const multer = require('multer');

const upload = multer();
router.post('/update-cover', upload.single('coverImage'), profileController.updateCoverImage);

router.get('/:id', profileController.profilePage);

router.post('/update-avatar', upload.single('avaImage'), profileController.updateAvaImage);
router.post('/password', profileController.chang_pass)
router.post('/bio', profileController.bio)

module.exports = router;
