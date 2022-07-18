// encrypt data
const crypto = require("crypto");
// encrypt the password in the database
const bcrypt = require("bcryptjs");
// package that allows us to send mails
const nodemailer = require("nodemailer");
// receive the messages from our validations in the routes
const { validationResult } = require("express-validator");
// User model
const User = require("../models/user");
// 500 error function
const errorFunc = require("../middleware/errorFunc");

// email env variable
const email_username = process.env.EMAIL_USERNAME;
// password env variable
const email_password = process.env.EMAIL_PASSWORD;

// function that makes it possible to send emails
const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: email_username,
    pass: email_password,
  },
});

// render the login page
exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    message: null,
    type: null,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

// login
exports.postLogin = (req, res, next) => {
  // get the email and the password from the form
  const email = req.body.email;
  const password = req.body.password;
  // get the errors from our validation checks in the routes
  const errors = validationResult(req);
  // if an error was found, render it
  if (!errors.isEmpty()) {
    res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      message: errors.array()[0].msg,
      type: "failure",
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }
  // No error is found
  User.findOne({ email: email }).then((user) => {
    // email doesn't exist in the database
    if (!user) {
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        message: "This email is not associated with any account",
        type: "failure",
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: [{ param: "email" }],
      });
    }
    // compare passwords
    bcrypt
      .compare(password, user.password)
      .then((valid) => {
        // incorrect password
        if (!valid) {
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            message: "The password is incorrect",
            type: "failure",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [{ param: "password" }],
          });
        }
        // set the isLoggedIn variable in the session and the userId
        req.session.isLoggedIn = true;
        req.session.userId = user._id;
        return req.session.save((err) => {
          console.log(err);
          res.redirect("/");
        });
      })
      .catch((err) => {
        console.log(err);
        return errorFunc(err, next);
      });
  });
};

// logout
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/login");
  });
};

// render the signup page
exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    message: null,
    type: null,
    oldInput: {
      email: "",
      name: "",
      address: "",
      age: "",
      gender: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

// signup
exports.postSignup = (req, res, next) => {
  // get all of this values from the form
  const name = req.body.name;
  const email = req.body.email;
  const address = req.body.address;
  const gender = req.body.gender;
  const age = req.body.age;
  const password = req.body.password;

  const errors = validationResult(req);
  // if an error is found, render the page again with the error
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      message: errors.array()[0].msg,
      type: "failure",
      oldInput: {
        email: email,
        password: password,
        name: name,
        address: address,
        gender: gender,
        age: age,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }
  // encrypt the password
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      // create the user in the database
      const user = new User({
        email: email,
        name: name,
        address: address,
        gender: gender,
        age: age,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
      // send a mail the the signup was successful
      return transporter.sendMail({
        to: email,
        from: email_username,
        subject: "Signup succeeded",
        html: "<h1>You succesfully signed up!<h1>",
      });
    })
    .catch(() => {
      // an specific error ocurred
      return res.status(422).render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        message:
          "This email address is already associated with an account or fill all the boxes",
        type: "failure",
        oldInput: {
          email: email,
          password: password,
          name: name,
          address: address,
          gender: gender,
          age: age,
          confirmPassword: req.body.confirmPassword,
        },
        validationErrors: [{ param: "email" }],
      });
    });
};

// render the reset password page
exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    message: null,
    type: null,
  });
};

// get the reset password email
exports.postReset = (req, res, next) => {
  // create an encrypted token
  crypto.randomBytes(32, (err, buff) => {
    // check if the function returns an error
    if (err) {
      console.log(err);
      return errorFunc(err, next);
    }
    // transform the token into a string
    const token = buff.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        // if the email provided doesn't exists
        if (!user) {
          return res.render("auth/reset", {
            path: "/reset",
            pageTitle: "Reset Password",
            message: "No account with that email!",
            type: "failure",
          });
        }
        // associate the token to the user, with an expiration date
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(() => {
        res.redirect("/");
        // send email to reset password
        return transporter.sendMail({
          to: req.body.email,
          from: email_username,
          subject: "Password reset token",
          html: `
            <p>You requested a password reset!</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password!</p>
          `,
        });
      })
      .catch((err) => {
        console.log(err);
        return errorFunc(err, next);
      });
  });
};

// render the reset password page
exports.getNewPassword = (req, res, next) => {
  // get the token from the url
  const token = req.params.token;
  // check for the token to still be valid
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        message: null,
        type: null,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// update the password
exports.postNewPassword = (req, res, next) => {
  // get all this info from the form
  const newPassword = req.body.password;
  // hidden values
  const userId = req.body.userId;
  const token = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      // encrypt the new password
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      // assign the new password, and eliminate the token
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      // save the new user info
      return resetUser.save();
    })
    .then(() => {
      req.flash("success", "Password reset successful");
      return res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};
