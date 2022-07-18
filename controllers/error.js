// render the 404 error page
exports.get404 = (req, res) => {
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
    path: "/404",
    isAuthenticated: req.session.isLoggedIn,
  });
};

// render the 500 error page
exports.get500 = (req, res) => {
  res.status(500).render("500", {
    pageTitle: "Sorry!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
};
