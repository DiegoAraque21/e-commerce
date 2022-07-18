const express = require("express");
// package that lets us validate input
const { check, body } = require("express-validator");
// import the authentication controller
const authController = require("../controllers/auth");
// manage the routes with this router
const router = express.Router();

// Login page route
router.get("/login", authController.getLogin);

router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Please enter a valid email"),
    body("password", "Please enter a password with more than 5 characters")
      .isLength({ min: 5 })
      .trim(),
  ],
  authController.postLogin
);

// Logout routes
router.post("/logout", authController.postLogout);

// Signup routes
router.get("/signup", authController.getSignup);
router.post(
  "/signup",
  [
    check("email").isEmail().withMessage("Please enter a valid email."),
    body("password", "Please enter a password with more than 5 characters")
      .isLength({ min: 5 })
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password has to match the confirmed one!");
        }
        return true;
      }),
    body("gender").custom((value) => {
      if (value === "...") {
        throw new Error("Choose a gender option");
      }
      return true;
    }),
    body("address")
      .trim()
      .custom((value) => {
        if (value === "") {
          throw new Error("Choose an address");
        }
        return true;
      }),
    body("age")
      .isInt({ min: 13, max: 89 })
      .trim()
      .custom((value) => {
        if (value === "") {
          throw new Error("Choose a valid age");
        }
        return true;
      }),
    body("name")
      .trim()
      .custom((value) => {
        if (value === "") {
          throw new Error("Choose a name");
        }
        return true;
      }),
  ],
  authController.postSignup
);

// Reset password routes
router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);
router.get("/reset/:token", authController.getNewPassword);
router.post(
  "/new-password",
  body("password", "Please enter a password with more than 5 characters")
    .isLength({ min: 5 })
    .trim(),
  authController.postNewPassword
);

module.exports = router;
