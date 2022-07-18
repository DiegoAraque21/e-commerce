const express = require("express");

// import the shop controller
const shopController = require("../controllers/shop");
// import the auth middleware
const isAuth = require("../middleware/is-auth");
// manage the routes with this router
const router = express.Router();

// MAIN PAGE (INDEX)
router.get("/", shopController.getIndex);

// SHOPPING CART
router.get("/cart", isAuth, shopController.getCart);
router.post("/cart", isAuth, shopController.postCart);

// DELETE ITEM FROM THE CART
router.post("/cart-delete-item", isAuth, shopController.postDeleteCartItem);

// CHECKOUT, Stripe included in this controllers
// It can be improved by adding webhooks, so the person can't submit the order
// without paying.
router.get("/checkout", isAuth, shopController.getCheckout);
router.get("/checkout/success", shopController.getCheckoutSuccess);
router.get("/checkout/cancel", shopController.getCheckout);

// SPECIFIC PRODUCT ROUTE
router.get("/products/:productId", shopController.getProduct);

// ORDERS
router.get("/orders", isAuth, shopController.getOrders);
router.get("/orders/:orderId", isAuth, shopController.getInvoice);

module.exports = router;
