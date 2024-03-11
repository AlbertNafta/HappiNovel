const {Router} = require('express')
const uploadController = require('../controllers/uploadControllers')
const { requireAuth} = require('../middleware/authMiddleware')
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router()


router.get("/upload", requireAuth, uploadController.upload_get);
router.post("/upload", requireAuth, uploadController.upload_post);

router.post("/upload/addBook", requireAuth, upload.single('bookCover'), uploadController.addBook_post);
router.post("/upload/reviewBook", requireAuth, uploadController.reviewBook_post);
router.post("/upload/updateBook", requireAuth, upload.single('bookCover'), uploadController.updateBook_post);
router.post("/upload/deleteBook", requireAuth, uploadController.deleteBook_post);

router.post("/upload/addVolume", requireAuth, uploadController.addVolume_post);
router.post("/upload/reviewVolume", requireAuth, uploadController.reviewVolume_post);
router.post("/upload/updateVolume", requireAuth, uploadController.updateVolume_post);
router.post("/upload/deleteVolume", requireAuth, uploadController.deleteVolume_post);

router.post("/upload/addChapter", requireAuth, uploadController.addChapter_post);
router.post("/upload/reviewChapter", requireAuth, uploadController.reviewChapter_post);
router.post("/upload/updateChapter", requireAuth, uploadController.updateChapter_post);
router.post("/upload/deleteChapter", requireAuth, uploadController.deleteChapter_post);


module.exports = router;