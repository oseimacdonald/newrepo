const { body, validationResult } = require("express-validator");

const classificationRules = () => {
  return [
    body("classification_name")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Classification name is required.")
      .isAlphanumeric()
      .withMessage("No spaces or special characters allowed.")
  ];
};

const checkClassificationData = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const nav = res.locals.nav; // if set globally
    res.render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      message: null,
      errors: errors.mapped(),
      classification_name: req.body.classification_name,
    });
    return;
  }
  next();
};

module.exports = {
  classificationRules,
  checkClassificationData,
};
