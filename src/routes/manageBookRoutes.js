const {Router} = require('express')
const manageBookController = require('../controllers/manageBookController')
const { requirePermission } = require('../middleware/authMiddleware')

const router = Router()

router.get('/managePending/:id', requirePermission(1), manageBookController.viewBook);
router.get('/managePending/:bookID/:chapID', requirePermission(1), manageBookController.viewChapter);
router.put('/managePending/approveBook', requirePermission(1), manageBookController.approveBook);
router.delete('/managePending/rejectBook', requirePermission(1), manageBookController.rejectBook);
router.put('/managePending/approveChap', requirePermission(1), manageBookController.approveChap);
router.delete('/managePending/rejectChap', requirePermission(1), manageBookController.rejectChap);

module.exports = router;