const express = require("express");
// package that lets us validate input
const { check } = require("express-validator");
// import the admin controller
const adminController = require("../controllers/admin");
// import the auth
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post(
  "/add-product",
  isAuth,
  [
    check("title")
      .trim()
      .custom((value) => {
        if (value === "") {
          throw new Error("Fill the marked box");
        }
        return true;
      }),
    check("price").isFloat().withMessage("Fill the marked box"),
    check("description")
      .trim()
      .isLength({ min: 5, max: 250 })
      .custom((value) => {
        if (value === "") {
          throw new Error("Fill the marked box");
        }
        return true;
      }),
    check("amount")
      .trim()
      .isInt()
      .withMessage("Please enter how many products you are selling"),
  ],
  adminController.postAddProduct
);

// /admin/edit-product => GET
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

// /admin/edit-product => POST
router.post(
  "/edit-product",
  isAuth,
  [
    check("title")
      .trim()
      .custom((value) => {
        if (value === "") {
          throw new Error("Fill the marked box");
        }
        return true;
      }),
    check("price").isFloat().withMessage("Fill the marked box"),
    check("description")
      .trim()
      .isLength({ min: 5, max: 250 })
      .custom((value) => {
        if (value === "") {
          throw new Error("Fill the marked box");
        }
        return true;
      }),
    check("amount")
      .trim()
      .isInt()
      .withMessage("Please enter how many products you are selling"),
  ],
  adminController.postEditProduct
);

// /admin/products
router.get("/products", isAuth, adminController.getProducts);

// admin/delete-product => POST
router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;
