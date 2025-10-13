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

/* ******************************
 * Upgrade Validation Rules
 * ***************************** */
const upgradeRules = () => {
  return [
    body("upgrade_id")
      .isInt({ min: 1 })
      .withMessage("Valid upgrade ID is required."),
    body("vehicle_id")
      .isInt({ min: 1 })
      .withMessage("Valid vehicle ID is required."),
    body("quantity")
      .isInt({ min: 1, max: 10 })
      .withMessage("Quantity must be between 1 and 10.")
  ];
};

/* ******************************
 * Cart Validation Rules
 * ***************************** */
const cartRules = () => {
  return [
    body("cart_item_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Valid cart item ID is required."),
    body("quantity")
      .isInt({ min: 0, max: 10 })
      .withMessage("Quantity must be between 0 and 10.")
  ];
};

/* ******************************
 * Check Inventory Data
 * ***************************** */
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
 * Check Update Data
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

/* ******************************
 * Check Upgrade Data
 * ***************************** */
const checkUpgradeData = async (req, res, next) => {
  console.log("checkUpgradeData middleware hit");
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // For AJAX requests, return JSON response
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // For regular requests, redirect with flash message
    req.flash('error', 'Please check your upgrade selection and try again.');
    return res.redirect('back');
  }

  next();
};

/* ******************************
 * Check Cart Data
 * ***************************** */
const checkCartData = async (req, res, next) => {
  console.log("checkCartData middleware hit");
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // For AJAX requests, return JSON response
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // For regular requests, redirect with flash message
    req.flash('error', 'Please check your cart item and try again.');
    return res.redirect('/cart');
  }

  next();
};

/* ******************************
 * Validate Upgrade ID Parameter
 * ***************************** */
const validateUpgradeId = async (req, res, next) => {
  const upgradeId = parseInt(req.params.upgradeId || req.body.upgrade_id);
  
  if (!upgradeId || upgradeId < 1) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upgrade ID'
      });
    }
    
    req.flash('error', 'Invalid upgrade selection.');
    return res.redirect('back');
  }
  
  next();
};

/* ******************************
 * Validate Vehicle ID Parameter
 * ***************************** */
const validateVehicleId = async (req, res, next) => {
  const vehicleId = parseInt(req.params.vehicleId || req.body.vehicle_id);
  
  if (!vehicleId || vehicleId < 1) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }
    
    req.flash('error', 'Invalid vehicle selection.');
    return res.redirect('back');
  }
  
  next();
};

/* ******************************
 * Validate Cart Item ID Parameter
 * ***************************** */
const validateCartItemId = async (req, res, next) => {
  const cartItemId = parseInt(req.params.cart_item_id || req.body.cart_item_id);
  
  if (!cartItemId || cartItemId < 1) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID'
      });
    }
    
    req.flash('error', 'Invalid cart item.');
    return res.redirect('/cart');
  }
  
  next();
};

module.exports = { 
  inventoryRules, 
  checkInventoryData, 
  checkUpdateData,
  upgradeRules,
  cartRules,
  checkUpgradeData,
  checkCartData,
  validateUpgradeId,
  validateVehicleId,
  validateCartItemId
};