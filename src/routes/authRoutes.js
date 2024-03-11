const {Router} = require('express')
const authController = require('../controllers/authControllers')
const { preventLoginAgain } = require('../middleware/authMiddleware')


const router = Router()

router.get('/login', preventLoginAgain, authController.login_get)
router.post('/login', authController.login_post)
router.get('/register', preventLoginAgain, authController.register_get)
router.post('/register', authController.register_post)
router.get('/forgetPassword', preventLoginAgain, authController.forgetPassword_get)
router.post('/forgetPassword', authController.forgetPassword_post)
router.get('/logout', authController.logout_get)



module.exports = router;