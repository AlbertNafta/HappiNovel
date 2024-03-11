const mongoose = require("mongoose")
const bcrypt = require('bcrypt')
const {isAlphanumeric} = require('validator')

const accountSchema = new mongoose.Schema ({
    userID: {
        type: Number,
        unique: true,
        require: true,
    },
    profileName: {
        type: String,
        required: [true, 'Vui lòng nhập tên của bạn!'],
    },
    username: {
        type: String,
        required: [true, 'Vui lòng nhập tài khoản!'],
        unique: true,
        validate: [isAlphanumeric, 'Tên đăng nhập chỉ chứa các kí tự "a-z, A-Z và 0-9"!'],
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu!'],
        minLength: [6, 'Mật khẩu cần tối thiểu 6 ký tự!'],
        validate: [isAlphanumeric, 'Mật khẩu chỉ chứa các kí tự "a-z, A-Z và 0-9"!'],
    },
    sdt: {
        type: String,
        required: [true, 'Vui lòng nhập số điện thoại của bạn!'],
        unique: true,
    },
    dob: {
        type: Date,
        required: [true, 'Vui lòng nhập ngày sinh của bạn!'],
    },
    bio: {
        type: String,
        required: false,
        maxLength: [255, 'Giới hạn tối đa là 255 từ'],
        default: "",
    },
    jobs: {
        type: String,
        required: false,
        maxLength: [255, 'Giới hạn tối đa là 255 từ'],
        default: "",
    },
    favorites: {
        type: String,
        required: false,
        maxLength: [255, 'Giới hạn tối đa là 255 từ'],
        default: "",
    },
    avatarURL: {
        type: String,
        required: false,
        default: "defaultAvt.png"
    },
    coverURL: {
        type: String,
        required: false,
        default: "defaultBg.png"
    },
    status: {
        type: Number,
        default: 0,
        required: true,
    },
    regdate: {
        type: Date,
        default: new Date(),
        required: true,
    },
    permission: {
        type: Number,
        default: 0,
        required: true,
    },
});

accountSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
})


// static method to login
accountSchema.statics.login = async function(username, password) {
    const user = await this.findOne({username});
    if (user) {
        if (user.status == 1) throw Error('Tài khoản của bạn đã bị cấm')
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            return user;
        }
    }
    throw Error('Tên đăng nhập hoặc mật khẩu không chính xác')
}

// static method to find password
accountSchema.statics.forgetPassword = async function(username, sdt, password) {
    const user = await Account.findOne({username: username, sdt: sdt})
    if (user) {
        // console.log(user)
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(password, salt);
        await Account.updateOne({username: username, sdt: sdt}, {password: password})
        return user
    }
    throw Error('Tên đăng nhập hoặc số điện thoại không chính xác')
}

const Account = mongoose.model("accounts", accountSchema);
module.exports = Account