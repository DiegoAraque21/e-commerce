// function that throws a 500 error
// which means that the error comes from the server
module.exports = (err, next) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
};
