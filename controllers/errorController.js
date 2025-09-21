const errorController = {}

errorController.triggerError = (req, res, next) => {
  const error = new Error("This is an intentional server error for testing.");
  error.status = 500;
  next(error); /* send error to middleware */
};

module.exports = errorController;
