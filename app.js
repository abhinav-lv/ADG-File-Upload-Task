require('dotenv').config();
require(__dirname+'/auth'); // auth.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const passport = require('passport');
const fs = require('fs-extra');
const { dirname } = require('path');

// CONFIGURE APP
const app = express();
app.use(express.static('public'));
// app.use('view engine',ejs);
app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

// Function to check if user is logged in
const isLoggedIn = (req,res,next) => req.user ? next() : res.sendStatus(401);

// MULTER
const tempDir = __dirname+'/users/tmp/';
const upload = multer({dest: tempDir});
var oldPath, newPath, userName;


// ROUTES ---

// Login
app.get('/',(req,res) => {
    res.sendFile(__dirname+'/public/html/login.html');
});


// Google Auth Routes
app.get('/auth/google',
    passport.authenticate('google', {scope: ['email','profile']})
);

app.get('/google/callback', passport.authenticate('google', {
    successRedirect: '/main',
    failureRedirect: 'auth/failure',
}));

app.get('/auth/failure', (req,res) => {
    res.sendFile(__dirname+'/public/html/error.html');
});


// Dashboard / Main
app.get('/main', isLoggedIn, (req,res) => {

    // Get username from user's email (gmail)
    userName = req.user._json.email.split('@')[0];

    // set newPath to users/<userName>/
    newPath = __dirname+'/users/'+userName+'/';
    res.sendFile(__dirname+'/public/html/main.html');
});


// Upload - GET
app.get('/upload', isLoggedIn, (req,res) => {
    res.sendFile(__dirname+'/public/html/upload.html');
});

// Upload - POST
app.post('/upload', isLoggedIn, upload.single('file'), (req,res) => {

    // set oldPath to path of file uploaded by multer in /tmp
    oldPath = req.file.path;
    
    // make directory for user if non existent
    if(!fs.existsSync(newPath)){
        fs.mkdirSync(newPath, {recursive: true});
    }

    // console.log(req.file);
    newPath+=(req.file.originalname.split(' ').join('_'));

    // move uploaded file from tmp to user's folder
    fs.move(oldPath, newPath, (err) => {
        if(err) console.log(err)
    });

    res.redirect('/main');
})


// Retrieve uploaded files
app.get('/retrieve', isLoggedIn, (req,res) => {

    const userDir = __dirname+'/users/'+userName+'/';
    const filesOb = {
        fileCount: 0,
        files: [],
        filePath: userDir,
    };

    console.log(filesOb);

    fs.readdir(userDir, (err, files) => {
        filesOb.fileCount = files.length;
        filesOb.files = files;
        // console.log(userFiles);


        // TODO: DISPLAY TABLE OF FILES AND ALLOW USER TO DOWNLOAD FILES
        res.render('retrieve',{filesOb});
    });
});

// Download a file 
app.get('/retrieve/:fileName', isLoggedIn, (req,res) => {
    const userDir = __dirname+'/users/'+userName+'/';
    const filePath = userDir + req.params.fileName;
    
    res.download(filePath, req.params.fileName);
})


// Logout
app.get('/logout', isLoggedIn, (req,res) => {
    req.session.destroy((err) => {
        res.sendFile(__dirname+'/public/html/logout.html');
    });
});


// ----------------------------------------------------------------------------
// SERVER
app.listen(5000, () => console.log('Server started on port 5000'));