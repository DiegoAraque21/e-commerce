// file system package
const fs = require("fs");
// path package
const path = require("path");
// pdfkit package
const PDFDoc = require("pdfkit");
// Product model
const Product = require("../models/product");
// Order model
const Order = require("../models/order");
// 500 error function
const errorFunc = require("../middleware/errorFunc");
// pagination function
const paginationRender = require("../Helpers/paginationRender");
// require stripe for payments
const stripe = require("stripe")(process.env.STRIPE_KEY);

// render a single specific product
exports.getProduct = (req, res, next) => {
  // get the id from the url
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// render the main page
exports.getIndex = (req, res, next) => {
  // in what page are we?
  let page = +req.query.page || 1;
  paginationRender(page, "shop/index", "Shop", "/", res).catch((err) => {
    console.log(err);
    return errorFunc(err, next);
  });
};

// render the cart
exports.getCart = (req, res, next) => {
  // take advantage that the product ID in the cart
  // is a reference and populate this field, since normally
  // it just contains the quantity and the id
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// add an item to the cart
exports.postCart = (req, res, next) => {
  // get the id of the item you want to add
  // from the body. Thank you! body-parser
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      // if the product is out of stock, render the main page
      // with a 422 error code
      if (product.amount <= 0) {
        req.flash("failure", `${product.title} is out of stock!`);
        res.redirect("/");
      } else {
        return req.user.addToCart(product).then(() => {
          req.flash("success", "Product added succesfully to the cart");
          return res.redirect("cart");
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// delete an item from the cart
exports.postDeleteCartItem = (req, res, next) => {
  // get the id of the item you want to add
  // from the body. Thank you! body-parser
  const prodId = req.body.productId;
  // use the deleteCartItem magic function created with mongoose
  req.user
    .deleteCartItem(prodId)
    .then(() => {
      req.flash("success", "Product deleted succesfully from the cart");
      return res.redirect("cart");
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// get checkout page
exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  // take advantage that the product ID in the cart
  // is a reference and populate this field, since normally
  // it just contains the quantity and the id
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });
      // create stripe object, with some important values
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((prod) => {
          return {
            name: prod.productId.title,
            description: prod.productId.description,
            amount: prod.productId.price * 100,
            currency: "usd",
            quantity: prod.quantity,
          };
        }),
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url:
          req.protocol + "://" + req.get("host") + "/checkout/failure",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        totalSum: total,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// create an order
exports.getCheckoutSuccess = (req, res, next) => {
  // take advantage that the product ID in the cart
  // is a reference and populate this field, since normally
  // it just contains the quantity and the id
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      // Total value of the order
      let total = 0;
      // quantity of the product
      let quantity;
      // update the total variable
      const products = user.cart.items.map((prod) => {
        total += prod.productId._doc.price * prod.quantity;
        quantity = prod.quantity;
        Product.findOne({ _id: prod.productId._doc._id }).then((product) => {
          // diminish the in-stock value
          product.amount -= quantity;
          return product.save();
        });
        // product array, with all the fields
        return {
          quantity: prod.quantity,
          product: { ...prod.productId._doc },
        };
      });
      // create and save the new order
      const order = new Order({
        user: {
          name: req.user.name,
          email: req.user.email,
          address: req.user.address,
          userId: req.user,
        },
        products: products,
        total: total,
      });
      return order.save();
    })
    .then(() => {
      // clear the cart
      return req.user.clearCart();
    })
    .then(() => {
      // render the orders of that user
      req.flash("success", "Your order was successful");
      return res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// render the orders page
exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
        message: null,
        type: null,
      });
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};

// give a pdf file to the user, which has details of the order
exports.getInvoice = (req, res, next) => {
  // get the id from the url
  const orderId = req.params.orderId;
  Order.findById({ _id: orderId })
    .then((order) => {
      // if there is no order return an error
      if (!order) {
        return res.status(404).render("404", {
          pageTitle: "Page Not Found",
          path: "/404",
          isAuthenticated: req.session.isLoggedIn,
        });
      }
      // if the order isn't from that user return an error
      if (order.user.userId.toString() !== req.user._id.toString()) {
        req.flash("failure", "That order is not yours!");
        return res.redirect("/");
      }
      // naime of the file that will be created
      const invoiceName = "invoice-" + orderId + ".pdf";
      // path in which the file is saved
      const invoicePath = path.join("data", "invoices", invoiceName);

      // Create PDF
      const pdfDoc = new PDFDoc();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`);
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      // Fill the pdf with info
      pdfDoc.fontSize(30).text("Your Order", { underline: true });
      pdfDoc.fontSize(15).text("------------------------");
      order.products.forEach((prod) => {
        pdfDoc
          .fontSize(14)
          .text(
            `${prod.product.title} ------------ ${prod.quantity}x $${prod.product.price}`
          );
      });
      pdfDoc.fontSize(15).text("------------------------");
      pdfDoc.fontSize(20).text(`Total: ${order.total}`);
      pdfDoc.end();
    })
    .catch((err) => {
      console.log(err);
      return errorFunc(err, next);
    });
};
