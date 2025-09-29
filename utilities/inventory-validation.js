const { body, validationResult } = require("express-validator");

const inventoryRules = () => {
  return [
    body("inv_make").trim().notEmpty().withMessage("Make is required."),
    body("inv_model").trim().notEmpty().withMessage("Model is required."),
    body("inv_year").isInt({ min: 1885 }).withMessage("Valid year required."),
    body("inv_price").isFloat({ min: 0 }).withMessage("Valid price required."),
    body("inv_miles").isInt({ min: 0 }).withMessage("Valid mileage required."),
    body("inv_description").notEmpty().withMessage("Description is required."),
    body("inv_image").notEmpty().withMessage("Image path required."),
    body("inv_thumbnail").notEmpty().withMessage("Thumbnail path required."),
    body("inv_color").notEmpty().withMessage("Color is required."),
    body("classification_id").notEmpty().withMessage("Classification required.")
  ];
};

const checkInventoryData = async (req, res, next) => {
  const errors = validationResult(req);
  const nav = await require("../utilities/").getNav();
  const classificationList = await require("../utilities/").buildClassificationList(
    req.body.classification_id
  );

  if (!errors.isEmpty()) {
    return res.render("inventory/add-inventory", {
      title: "Add New Inventory",
      nav,
      classificationList,
      message: null,
      errors: errors.mapped(),
      formData: req.body
    });
  }
  next();
};

module.exports = { inventoryRules, checkInventoryData };
