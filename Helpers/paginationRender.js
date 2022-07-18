// Product Model
const Product = require("../models/product");

// pagination function
module.exports = (page, route, pageTitle, pathActive, res) => {
  // pagiantion max amount of items
  const ITEMS_PER_PAGE = 3;
  let totalItems;
  return Product.find()
    .countDocuments()
    .then((numProds) => {
      totalItems = numProds;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render(route, {
        prods: products,
        pageTitle: pageTitle,
        path: pathActive,
        totalProds: totalItems,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        currentPage: page,
      });
    });
};
