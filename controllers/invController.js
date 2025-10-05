const { validationResult } = require("express-validator");
const invModel = require("../models/inventory-model");
const utilities = require("../utilities");

const invCont = {};

// ========== ADD THIS MISSING FUNCTION ==========
/* ****************************************
*  Build browse ALL vehicles view - handles "/inv" route
* *************************************** */
invCont.buildByClassification = async function (req, res, next) {
  try {
    console.log("🔄 Building ALL vehicles browse page");
    const nav = await utilities.getNav();
    
    // Get all classifications for the navigation
    const classifications = await invModel.getClassifications();
    
    // Get ALL vehicles for browsing
    const vehicles = await invModel.getAllInventory();
    
    console.log("=== ALL VEHICLES DEBUG ===");
    console.log("Classifications found:", classifications.rows ? classifications.rows.length : 0);
    console.log("Vehicles found:", vehicles ? vehicles.length : 0);
    
    if (vehicles && vehicles.length > 0) {
      console.log("Sample vehicle:", {
        id: vehicles[0].inv_id,
        make: vehicles[0].inv_make,
        model: vehicles[0].inv_model
      });
    }
    
    // Build the grid using your existing utility function
    const grid = await utilities.buildClassificationGrid(vehicles || []);
    
    res.render("./inventory/classification", {
      title: "Browse All Vehicles",
      nav,
      grid,
      classifications: classifications.rows || []
    });
  } catch (error) {
    console.error("❌ Error in buildByClassification:", error);
    next(error);
  }
};

// ========== KEEP ALL YOUR EXISTING FUNCTIONS ==========

/* ****************************************
*  Build inventory by classification view
* *************************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId;
  const data = await invModel.getInventoryByClassificationId(classification_id);
  const grid = await utilities.buildClassificationGrid(data);
  const nav = await utilities.getNav();

  //Get all classifications for the navigation
  const classifications = await invModel.getClassifications();
  const className = data.length > 0 ? data[0].classification_name : "Vehicles";

  res.render("./inventory/classification", {
    title: `${className} vehicles`,
    nav,
    grid,
    classifications: classifications.rows || []
  });
};

/* ****************************************
*  Build vehicle detail view
* *************************************** */
invCont.getVehicleDetail = async function (req, res, next) {
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

/* ****************************************
*  Build inventory management view
* *************************************** */
invCont.buildManagement = async function (req, res, next) {
  const nav = await utilities.getNav();
  const classificationSelect = await utilities.buildClassificationList();
  let successMessage = null;
  
  if (req.session && req.session.loginSuccess) {
    successMessage = req.session.loginSuccess;
    delete req.session.loginSuccess;
  } else if (req.flash) {
    successMessage = req.flash('success')[0] || null;
  }
  
  res.render("inventory/management", {
    title: "Inventory Management",
    nav,
    classificationSelect,
    successMessage: successMessage,
    message: null,
    errors: null
  });
};

/* ****************************************
*  Show Add Classification form
* *************************************** */
invCont.showAddClassificationForm = async function (req, res, next) {
  const nav = await utilities.getNav();
  res.render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    message: req.flash("message"),
    errors: null,
  });
};

/* ****************************************
*  Add new classification
* *************************************** */
invCont.addClassification = async function (req, res, next) {
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

/* ****************************************
*  Show Add Inventory Form
* *************************************** */
invCont.showAddInventoryForm = async function (req, res, next) {
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

/* ****************************************
*  Add new inventory item
* *************************************** */
invCont.addInventory = async function (req, res, next) {
  const nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList();
  const errors = validationResult(req);

  const formData = {
    ...req.body,
  };

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

    const insertResult = await invModel.addInventoryItem({
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

/* ****************************************
*  Get Inventory by Classification as JSON
* *************************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  const classification_id = parseInt(req.params.classification_id)
  const invData = await invModel.getInventoryByClassificationId(classification_id)
  
  if (invData && invData.length > 0 && invData[0].inv_id) {
    return res.json(invData)
  } else {
    return res.json([])
  }
}

/* ****************************************
*  Build edit inventory view
* *************************************** */
invCont.editInventoryView = async function (req, res, next) {
  const inv_id = parseInt(req.params.inv_id)
  let nav = await utilities.getNav()
  const itemData = await invModel.getVehicleById(inv_id)
  const classificationSelect = await utilities.buildClassificationList(itemData.classification_id)
  const itemName = `${itemData.inv_make} ${itemData.inv_model}`
  res.render("./inventory/edit-inventory", {
    title: "Edit " + itemName,
    nav,
    classificationSelect: classificationSelect,
    errors: null,
    message: null,
    inv_id: itemData.inv_id,
    inv_make: itemData.inv_make,
    inv_model: itemData.inv_model,
    inv_year: itemData.inv_year,
    inv_description: itemData.inv_description,
    inv_image: itemData.inv_image,
    inv_thumbnail: itemData.inv_thumbnail,
    inv_price: itemData.inv_price,
    inv_miles: itemData.inv_miles,
    inv_color: itemData.inv_color,
    classification_id: itemData.classification_id
  })
}

/* ****************************************
*  Update Inventory Data
* *************************************** */
invCont.updateInventory = async function (req, res, next) {
  let nav = await utilities.getNav()
  const {
    inv_id,
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body
  const updateResult = await invModel.updateInventory(
    inv_id,  
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id
  )

  if (updateResult) {
    const itemName = updateResult.inv_make + " " + updateResult.inv_model
    req.flash("notice", `The ${itemName} was successfully updated.`)
    res.redirect("/inv/")
  } else {
    const classificationSelect = await utilities.buildClassificationList(classification_id)
    const itemName = `${inv_make} ${inv_model}`
    req.flash("notice", "Sorry, the insert failed.")
    res.status(501).render("inventory/edit-inventory", {
    title: "Edit " + itemName,
    nav,
    classificationSelect: classificationSelect,
    errors: null,
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
    classification_id
    })
  }
}

module.exports = invCont;