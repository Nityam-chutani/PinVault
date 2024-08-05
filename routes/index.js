var express = require('express');
var router = express.Router();
const userModel = require('./users'); // Adjust the path if necessary
const postModel = require('./posts');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const upload = require("./multer");
passport.use(new LocalStrategy(userModel.authenticate()));

// Serialize and deserialize user (required for session support)
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/register', function (req, res, next) {
  res.render('register');
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  console.log(user);
  res.render("profile", { user });
});

router.get('/show/posts', isLoggedIn, async function (req, res, next) {
  const user =
    await userModel
      .findOne({ username: req.session.passport.user })
      .populate("posts")
  res.render("show", { user });
});

router.get('/feed', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  const posts = await postModel.find()
    .populate("user")
  res.render("feed", { user, posts});
});
router.post('/fileupload', isLoggedIn, upload.single("image"), async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});
router.get('/add', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("add", { user });
});
router.post('/createpost', isLoggedIn, upload.single("postimage"), async function (req, res, next) {
  // console.log(req.file); 
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

router.post('/register', function (req, res, next) {
  const data = new userModel({
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact
  });

  userModel.register(data, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.render('register', { error: err.message });
    }
    passport.authenticate('local')(req, res, function () {
      res.redirect('/profile');
    });
  });
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/',
  successRedirect: '/profile'
}));

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
}

module.exports = router;