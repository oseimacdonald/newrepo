const { validationResult } = require("express-validator");
const invModel = require("../models/inventory-model");
const utilities = require("../utilities");

const invCont = {};

// Build inventory by classification
invCont.buildByClassificationId = async function (req, res) {
  const classification_id = req.params.classificationId;
  const data = await invModel.getInventoryByClassificationId(classification_id);
  const grid = await utilities.buildClassificationGrid(data);
  const nav = await utilities.getNav();
  const className = data.length > 0 ? data[0].classification_name : "Vehicles";

  res.render("./inventory/classification", {
    title: `${className} vehicles`,
    nav,
    grid,
  });
};

// Get vehicle detail
invCont.getVehicleDetail = async function (req, res) {
  const vehicleId = req.params.vehicleId;

  try {
    const vehicleData = await invModel.getVehicleById(vehicleId);

    if (vehicleData) {
      const nav = await utilities.getNav();
      res.render("inventory/vehicle-detail", {
        title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
        nav,
        vehicleData,
      });
    } else {
      res.status(404).send("Vehicle not found");
    }
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    res.status(500).send("Error fetching vehicle details");
  }
};

// Inventory management view
invCont.buildManagementView = async function (req, res) {
  const nav = await utilities.getNav();
  res.render("inventory/management", {
    title: "Inventory Management",
    nav,
    message: req.flash("message"),
  });
};

// Show Add Classification form
invCont.showAddClassificationForm = async function (req, res) {
  const nav = await utilities.getNav();
  res.render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    message: req.flash("message"),
    errors: null,
  });
};

// Handle POST for Classification
invCont.addClassification = async function (req, res) {
  const { classification_name } = req.body;
  const nav = await utilities.getNav();

  try {
    const result = await invModel.addClassification(classification_name);

    if (result) {
      req.flash("message", "New classification added successfully.");
      res.redirect("/inv");
    } else {
      req.flash("message", "Failed to add classification.");
      res.status(500).render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        message: req.flash("message"),
        classification_name,
        errors: null,
      });
    }
  } catch (err) {
    console.error("Add classification error:", err);
    req.flash("message", "An error occurred.");
    res.status(500).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      message: req.flash("message"),
      classification_name,
      errors: null,
    });
  }
};

// Show Add Inventory Form (GET)
invCont.showAddInventoryForm = async function (req, res) {
  const nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList();

  res.render("inventory/add-inventory", {
    title: "Add New Vehicle",
    nav,
    classificationList,
    errors: null,
    message: req.flash("message"),
    formData: {},
  });
};

// Handle POST for adding new vehicle
invCont.addInventory = async function (req, res) {
  const nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList();
  const errors = validationResult(req);

  const formData = {
    ...req.body,
  };

  // Check for novalidate attribute from client side
  const isNovalidate = req.body.novalidate === "true";

  if (!errors.isEmpty()) {
    return res.status(400).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      message: isNovalidate ? ["Please fix the errors below."] : null,
      errors: isNovalidate ? errors.mapped() : null,
      formData,
    });
  }

  try {
    const {
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
    } = req.body;

    const insertResult = await invModel.addVehicle({
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
    });

    if (insertResult) {
      req.flash("message", "Vehicle successfully added.");
      return res.redirect("/inv");
    } else {
      req.flash("message", "Failed to add vehicle.");
      return res.status(500).render("inventory/add-inventory", {
        title: "Add New Vehicle",
        nav,
        classificationList,
        message: req.flash("message"),
        errors: null,
        formData,
      });
    }
  } catch (error) {
    console.error("Error adding vehicle:", error);
    req.flash("message", "An internal error occurred.");
    return res.status(500).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      message: req.flash("message"),
      errors: null,
      formData,
    });
  }
};

module.exports = invCont;
