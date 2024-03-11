const {Router} = require('express')
const notificationController = require('../controllers/notificationController');


const router = Router()

router.get('/notification', notificationController.notification);
router.delete('/notification/delete', notificationController.deleteNoti);

module.exports = router;