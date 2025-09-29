const { body, validationResult } = require('express-validator');
const utilities = require("../utilities");

const inventoryRules = () => {
  return [
    body("inv_make")
      .trim()
      .notEmpty()
      .withMessage("Make is required."),
    body("inv_model")
      .trim()
      .notEmpty()
      .withMessage("Model is required."),
    body("inv_year")
      .isInt({ min: 1885, max: new Date().getFullYear() + 1 })
      .withMessage("Valid year required."),
    body("inv_price")
      .isFloat({ min: 0 })
      .withMessage("Valid price required."),
    body("inv_miles")
      .isInt({ min: 0 })
      .withMessage("Valid mileage required."),
    body("inv_description")
      .notEmpty()
      .withMessage("Description is required."),
    body("inv_image")
      .notEmpty()
      .withMessage("Image path required."),
    body("inv_thumbnail")
      .notEmpty()
      .withMessage("Thumbnail path required."),
    body("inv_color")
      .notEmpty()
      .withMessage("Color is required."),
    body("classification_id")
      .notEmpty()
      .withMessage("Classification required.")
  ];
};

const checkInventoryData = async (req, res, next) => {
  console.log("checkInventoryData middleware hit");
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    const classificationList = await utilities.buildClassificationList(
      req.body.classification_id
    );

    return res.status(400).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      message: null,
      errors: errors.mapped(),
      formData: req.body,
      novalidate: true
    });
  }

  next();
};

module.exports = { inventoryRules, checkInventoryData };