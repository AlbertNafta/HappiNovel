const Account = require('../models/Account')
const jwt = require('jsonwebtoken')


const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = {
        profileName: '',
        username: '',
        password: '',
        sdt: '',
        dob: ''
    }

    if (err.message === 'Tài khoản của bạn đã bị cấm') {
        errors.password = 'Tài khoản của bạn đã bị cấm';
    }

    if (err.message === 'Tên đăng nhập hoặc mật khẩu không chính xác') {
        errors.password = 'Tên đăng nhập hoặc mật khẩu không chính xác';
    }

    if (err.message === 'Tên đăng nhập hoặc số điện thoại không chính xác') {
        errors.password = 'Tên đăng nhập hoặc số điện thoại không chính xác';
    }

    //exists username error
    if (err.code === 11000) {
        errors.username = 'Tên đăng nhập đã tồn tại';
        return errors;
    }

    // validation errors
    if (err.message.includes('accounts validation failed')){
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message;
        });
    }
    return errors;
}

async function generateUserID() {
    return Account.find({}).select('userID').sort({'userID': -1}).limit(1) 
}

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({id}, 'information of user', {
        expiresIn: maxAge
    })
}

module.exports.login_get = (req, res) => {
    res.render('login')
}

module.exports.register_get = (req, res) => {
    res.render('register')
}

module.exports.forgetPassword_get = (req, res) => {
    res.render('forgetPassword')
}

module.exports.login_post = async (req, res) => {
    // console.log(req.body)
    const username = req.body.username
    const password = req.body.password

    try {
        const user = await Account.login(username, password);
        const token = createToken(user._id)
        res.cookie('jwt', token, {httpOnly: true, maxAge: maxAge * 1000})
        res.status(200).json({user: user._id});
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({errors})
    }
}

module.exports.register_post = async (req, res) => {
    // console.log(req.body)
    const username = req.body.username
    const password = req.body.password
    const profileName = req.body.profileName
    const sdt = req.body.sdt
    const dob = req.body.dob
    maxID = await generateUserID()
    // console.log(maxID)
    const userID = maxID[0].userID + 1
    
    try {
        const user = await Account.create({
            userID: userID,
            profileName: profileName,
            username: username,
            password: password,
            sdt: sdt,
            dob: dob,
            regdate: new Date()
        })
        const token = createToken(user._id)
        res.cookie('jwt', token, {httpOnly: true, maxAge: maxAge * 1000})
        res.status(201).json({user: user._id});
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({errors});
    }
}

module.exports.forgetPassword_post = async (req, res) => {
    // console.log(req.body)
    const username = req.body.username
    const sdt = req.body.sdt
    const newpassword = req.body.password

    try {
        const user = await Account.forgetPassword(username, sdt, newpassword);
        res.status(201).json({user: user._id});
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({errors})
    }
}

module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', {maxAge: 1});
    res.redirect('/')
}