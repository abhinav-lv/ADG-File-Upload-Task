require('dotenv').config();
require(__dirname+'/auth');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const passport = require('passport');
const fs = require('fs-extra');
const { dirname } = require('path');

// CONFIGURE
const app = express();
app.use(express.static('public'));
app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());

// Function to check if user is logged in
const isLoggedIn = (req,res,next) => req.user ? next() : res.sendStatus(401);

// MULTER
const tempDir = __dirname+'/users/tmp/';
const upload = multer({dest: tempDir});
var oldPath, newPath;

// Function to move file ---------------TODO


// ROUTES
app.get('/',(req,res) => {
    res.sendFile(__dirname+'/public/html/login.html');
});

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

app.get('/main', isLoggedIn, (req,res) => {
    const userName = req.user._json.email.split('@')[0];
    newPath = __dirname+'/users/'+userName+'/';
    res.sendFile(__dirname+'/public/html/main.html');
});


// *** UPLOAD A PDF ***
app.get('/upload', isLoggedIn, (req,res) => {
    res.sendFile(__dirname+'/public/html/upload.html');
});

app.post('/upload', isLoggedIn, upload.single('file'), (req,res) => {
    oldPath = req.file.path;
    
    // make directory for user if non existent
    if(!fs.existsSync(newPath)){
        fs.mkdirSync(newPath, {recursive: true});
    }

    // console.log(req.file);
    newPath+=req.file.originalname;

    // move uploaded file from tmp to user dialhr
    fs.move(oldPath, newPath, (err) => {
        if(err) console.log(err)
    });

    res.redirect('/main');
})

app.get('/retrieve', isLoggedIn, (req,res) => {
    res.sendFile(__dirname+'/public/html/retrieve.html');
});

app.get('/logout', isLoggedIn, (req,res) => {
    req.session.destroy((err) => {
        res.sendFile(__dirname+'/public/html/logout.html');
    });
});

app.listen(5000, () => console.log('Server started on port 5000'));