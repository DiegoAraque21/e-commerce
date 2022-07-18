const path = require("path");
// const fs = require("fs");
// encrypts data, therefore is more secure
// const https = require("https");
// makes it possible for us to use
// Require the express framework
const express = require("express");
// Body parser lets us acces our request in an easier way
const bodyParser = require("body-parser");
// package that helps us interact with files
const multer = require("multer");
// mongoose lets us make the proccess of using mongoDB easier
const mongoose = require("mongoose");
// lets us create sessions
const session = require("express-session");
// lets us save our sessions in our mongoDB database
const MongoDbStore = require("connect-mongodb-session")(session);
// package that generate csrf tokens
const csrf = require("csurf");
// flash messages
const flash = require("connect-flash");
// compress files when rendered in the browser
const compression = require("compression");
// import the error controller
const errorController = require("./controllers/error");
// import our User model
const User = require("./models/user");

// Create the app with the express function
const app = express();

// store our sessions in our mongodb database
const store = new MongoDbStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});

// https keys
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

// declare the name of the file and in which folder it will be saved
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

// Establish that the user can only upload those types of files
const fileCondition = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Using EJS as the template engine
app.set("view engine", "ejs");
// Redundancy since views is the default option
// but its if your folder isn't called views
app.set("views", "views");

// Routes
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

// // files for loggs
// const accessLogStream = fs.createWriteStream(
//   path.join(__dirname, "access.log"),
//   { flags: "a" }
// );

// add secure headers to our responses
// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );

// compress files so they are not as big
// it will have a bigger effect if the app was bigger
app.use(compression());

// use body parser, so that every request uses
app.use(bodyParser.urlencoded({ extended: false }));
// middleware that uses the multer package to specify different conditions
// on how we handle our files
app.use(
  multer({ storage: fileStorage, fileFilter: fileCondition }).single("image")
);
// all the files in these folers are now static
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// configuration of the session
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// store csrf in the session
const csrfProtection = csrf();
app.use(csrfProtection);

// make the isLoggedIn available for our views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// check for a user
app.use((req, res, next) => {
  if (!req.session.userId) {
    return next();
  }
  User.findById(req.session.userId)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

// use flash in all our requests
app.use(flash());

// assignate values to responses that will be accesible everywhere
app.use((req, res, next) => {
  res.locals.successMessage = req.flash("success");
  res.locals.failureMessage = req.flash("failure");
  next();
});

// use the routes we imported
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// get the 500 error page as a last resort
app.get("/500", errorController.get500);

// get the 404
app.use(errorController.get404);

// render the 500 page, when our controllers throw a 500 error
app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("500", {
    pageTitle: "Sorry!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

// connect to our mongodb database
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("CONNECTED!!!");
    // https enableb, since i did the ssl encryptions and signed the keys
    // the browser doesn't like it and says that the site is insecure
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(process.env.PORT || 3000);
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => console.log(err));
