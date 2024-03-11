const jwt = require('jsonwebtoken');
const Account = require('../models/Account');
const {avatarContainer, profilecoverContainer} = require("./database")

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, 'information of user', (err, decodedToken) => {
            if (err) {
                // console.log(err.message);
                res.redirect('/login');
            }
            else {
                // console.log("Deny Guest's Access");
                next();
            }
        })
    }
    else {
        res.redirect('/login');
    }
}

// prevent login again
const preventLoginAgain = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, 'information of user', (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                next();
            }
            else {
                // console.log('Prevent Login Success');
                res.redirect('/');
            }
        })
    }
    else {
        next();
    }
}

// check current user
const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, 'information of user', async (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.locals.user = null;
                next();
            }
            else {

                // console.log('Current User: ' + decodedToken.id);
                let user = await Account.findById(decodedToken.id);

                user.avatarURL = avatarContainer.getBlobClient(user.avatarURL).url
                user.coverURL = profilecoverContainer.getBlobClient(user.coverURL).url
                res.locals.user = user;
                next();
            }
        })
    }
    else {
        res.locals.user = null;
        next();
    }
}

const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        const token = req.cookies.jwt;
        if (token) {
            jwt.verify(token, 'information of user', async (err, decodedToken) => {
                if (err) {
                    console.log(err.message);
                    res.redirect('/login');
                } else {
                    const user = await Account.findById(decodedToken.id);
                    if (user && user.permission >= requiredPermission) {
                        user.avatarURL = avatarContainer.getBlobClient(user.avatarURL).url
                        user.coverURL = profilecoverContainer.getBlobClient(user.coverURL).url
                        res.locals.user = user;
                        next();
                    } else {
                        res.status(404).render('error404')
                    }
                }
            });
        } else {
            res.redirect('/login');
        }
    };
};
module.exports = {requireAuth, checkUser, preventLoginAgain,requirePermission};
