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

/* ******************************
 * Check data and return errors or continue to update
 * ***************************** */
const checkUpdateData = async (req, res, next) => {
  console.log("checkUpdateData middleware hit");
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    const classificationSelect = await utilities.buildClassificationList(
      req.body.classification_id
    );
    
    // Extract individual fields from request body
    const { 
      inv_id, inv_make, inv_model, inv_year, inv_description, 
      inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, 
      classification_id 
    } = req.body;

    const itemName = `${inv_make} ${inv_model}`;

    return res.status(400).render("inventory/edit-inventory", {
      title: "Edit " + itemName,
      nav,
      classificationSelect,
      message: null,
      errors: errors.mapped(),
      inv_id,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
      novalidate: true
    });
  }

  next();
};

module.exports = { inventoryRules, checkInventoryData, checkUpdateData };