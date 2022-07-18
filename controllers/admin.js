// Product model
const Product = require("../models/product");
// receive the messages from our validation in the routes
const { validationResult } = require("express-validator");
// User model
const User = require("../models/user");
// delete file function
const fileHelper = require("../Helpers/file");
// 500 error function
const errorFunc = require("../middleware/errorFunc");

// render the add product page
exports.getAddProduct = (req, res) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    message: null,
    oldInput: {
      title: "",
      price: "",
      imageUrl: "",
      description: "",
    },
    validationErrors: [],
  });
};

// create a new product
exports.postAddProduct = (req, res, next) => {
  // get this info from the form
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const amount = req.body.amount;

  // if there is no image, return an error
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      message: "Attached file is not an image (.png , .jpg , .jpeg)",
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
        amount: amount,
      },
      validationErrors: [],
    });
  }
  // assign the image.path
  const imageUrl = image.path;

  const errors = validationResult(req);
  // if an error is found, render the page again
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      message: errors.array()[0].msg,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
        amount: amount,
      },
      validationErrors: errors.array(),
    });
  }
  // create new product
  const product = new Product({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    userId: req.user, // Mongoose will select the id from that document automatically
    amount,
    amount,
  });
  return product
    .save()
    .then(() => {
      // redirect to the your products page
      req.flash("success", "Product added successfully");
      return res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// render the edit product page
exports.getEditProduct = (req, res, next) => {
  // assign edit mode
  const editMode = req.query.edit;
  // if it is undefined you are redirected to tha main page
  if (!editMode) {
    return res.redirect("/");
  }
  // get the id from the url
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      // no product? redirect to the main page
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        hasError: false,
        product: product,
        message: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// edit the product, and save it to the database
exports.postEditProduct = (req, res, next) => {
  // get the image file
  const image = req.file;
  // get the product values form the form
  const newProduct = {
    _id: req.body.productId,
    title: req.body.title,
    price: req.body.price,
    description: req.body.description,
    amount: req.body.amount,
  };

  const errors = validationResult(req);
  // if an error is found, render the page with the error
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: `/admin/edit-product/${newProduct._id}`,
      editing: true,
      hasError: true,
      product: newProduct,
      message: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  // Update the product
  Product.findById(newProduct._id).then((product) => {
    // if it is not his product, redirect to main page
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.redirect("/");
    }
    // assign the updated values
    product.title = newProduct.title;
    product.price = newProduct.price;
    if (image) {
      // delete the old image
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }
    product.description = newProduct.description;
    product.amount = newProduct.amount;
    return product
      .save()
      .then(() => {
        // redirect to the your products page
        req.flash("success", "Product edited successfully");
        return res.redirect("/admin/products");
      })
      .catch((err) => {
        console.log(err);
        return errorFunc(err, next);
      });
  });
};

// render the Your products page
exports.getProducts = (req, res, next) => {
  // render the products of that user
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// delete a product
exports.postDeleteProduct = (req, res, next) => {
  // get the id from the form
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      // no product with that id?
      // return the 505 page
      if (!product) {
        console.log(err);
        return errorFunc(err, next);
      }
      // delete image file
      fileHelper.deleteFile(product.imageUrl);
      // start deletion from database
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then((result) => {
      // if nothing was deleted, return an error. Unauthorized
      if (result.deletedCount === 0) {
        req.flash("failure", "You can't delete this product");
        return res.redirect("/admin/products");
      }
      // deletion successful
      req.flash("success", "Product deleted successfully");
      return res.redirect("/admin/products");
    })
    .then(() => {
      // delete the item from every single cart that has it
      User.where("cart.items.productId")
        .equals(prodId)
        .then((users) => {
          users.forEach((user) => user.deleteCartItem(prodId));
        });
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};
