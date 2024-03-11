// Require Module
const cookieParser = require('cookie-parser')
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()   
// const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

// Require Routes
const authRoutes = require('./routes/authRoutes')
const bookRoutes = require('./routes/bookRoutes')
const profileRoutes = require('./routes/profileRoutes');
const bookMarkRoutes = require('./routes/bookMarkRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const bookInfoRoutes = require('./routes/bookInfoRoutes'); // Add the bookInfoRoutes
const readingHistoryRoutes = require('./routes/readingHistoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { requireAuth, checkUser} = require('./middleware/authMiddleware')
const manageRoutes = require('./routes/manageRoutes')
const manageBookRoutes = require('./routes/manageBookRoutes')
const manageUserRoutes = require('./routes/manageUserRoutes')
const manageCommentRoutes = require('./routes/manageCommentRoutes')
const managePendingRoutes = require('./routes/managePendingRoutes')
const searchRoutes = require('./routes/searchRoutes')

// Database connection
mongoose.connect('mongodb+srv://admin:123@happinovel.4zvtpnj.mongodb.net/HappiNovel?retryWrites=true&w=majority', {
    useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error: "));
db.once("open", function () {
    console.log("Connected successfully to MongoDB");
});

// Use and Set Module
app.use(express.static(path.join(__dirname, './public')))
app.set('views', path.join(__dirname, './views'))
app.set('view engine', 'ejs');
app.use(express.json())
app.use(bodyParser.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true}))


// Routes
app.get('*', checkUser);
app.use(bookRoutes)
app.use(authRoutes)
app.use(bookMarkRoutes)
app.use(uploadRoutes)
app.use(readingHistoryRoutes)
app.use(notificationRoutes)
app.use(searchRoutes)
app.get("/", (req, res) => res.render('home'));
app.use('/profile',profileRoutes);
app.get("/bookmark", requireAuth, (req, res) => res.render('bookmark'));
app.use('/book', bookInfoRoutes); // Add the bookInfoRoutes
app.get("/filter",(req,res) => res.render('filter'));
app.use(manageRoutes)
app.use(manageBookRoutes)
app.use(manageUserRoutes)
app.use(manageCommentRoutes)
app.use(managePendingRoutes)
app.use((req, res, next) => {
    // Set cache control headers to prevent caching for all responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();});
// Listen
const port = 3000
app.listen(port, function(){
    console.log(`Server started on port ${port}`);
});