const { validationResult } = require("express-validator");
const invModel = require("../models/inventory-model");
const utilities = require("../utilities");

const invCont = {};

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

/* ****************************************
*  Build upgrades selection view
* *************************************** */
invCont.buildUpgradesView = async function (req, res, next) {
  const vehicleId = req.params.vehicleId;
  try {
    const nav = await utilities.getNav();
    const vehicleData = await invModel.getVehicleById(vehicleId);
    const availableUpgrades = await invModel.getUpgradesByVehicleId(vehicleId);
    
    res.render("./upgrades/upgrades", {
      title: `Customize ${vehicleData.inv_make} ${vehicleData.inv_model}`,
      nav,
      vehicleData,
      availableUpgrades,
      errors: null
    });
  } catch (error) {
    console.error("Error building upgrades view:", error);
    next(error);
  }
};

/* ****************************************
*  Add upgrade to cart
* *************************************** */
invCont.addUpgradeToCart = async function (req, res, next) {
  try {
    console.log("🛒 Add Upgrade to Cart - Request received");
    console.log("Request body:", req.body);
    console.log("User:", req.user);

    const rawVehicleId = req.body.vehicle_id || req.body.inv_id;
    const upgrade_id = parseInt(req.body.upgrade_id, 10);
    const vehicle_id = parseInt(rawVehicleId, 10);
    const quantity = parseInt(req.body.quantity, 10) || 1;
    const account_id = req.user?.account_id;

    // Validate required fields
    if (!upgrade_id || isNaN(upgrade_id) || !vehicle_id || isNaN(vehicle_id)) {
      console.log("❌ Missing or invalid upgrade_id or vehicle_id");
      return res.status(400).json({
        success: false,
        message: "Missing or invalid upgrade_id or vehicle_id"
      });
    }

    if (!account_id) {
      console.log("❌ No account ID - user not logged in");
      return res.status(401).json({
        success: false,
        message: "Please log in to add items to cart"
      });
    }

    console.log(`🔧 Adding upgrade: ${upgrade_id} for vehicle: ${vehicle_id}, quantity: ${quantity}, account: ${account_id}`);

    const result = await invModel.addUpgradeToCart(
      upgrade_id,
      vehicle_id,
      quantity,
      account_id
    );

    console.log("Database result:", result);

    if (result && result.rows && result.rows.length > 0) {
      const cartCount = await invModel.getCartCount(account_id);
      console.log("✅ Upgrade added successfully. Cart count:", cartCount);
      res.json({
        success: true,
        message: "Upgrade added to cart successfully",
        cartCount: cartCount
      });
    } else {
      console.log("❌ Database returned no rows or false");
      res.status(500).json({
        success: false,
        message: "Failed to add upgrade to cart - no database response"
      });
    }
  } catch (error) {
    console.error("💥 Error adding to cart:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding to cart: " + error.message
    });
  }
};


/* ****************************************
*  Add item to cart (for regular inventory items)
* *************************************** */
invCont.addToCart = async function (req, res, next) {
  try {
    const rawInvId = req.body.inv_id || req.body.vehicle_id;
    const inv_id = parseInt(rawInvId, 10);
    const quantity = parseInt(req.body.quantity, 10) || 1;

    console.log("🧾 Request Body:", req.body);
    console.log("✅ Parsed inv_id:", inv_id, "quantity:", quantity);

    // Validate inv_id
    if (!inv_id || isNaN(inv_id)) {
      req.flash("error", "Invalid inventory item selected.");
      return res.redirect("back");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const account_id = req.user?.account_id;

    if (!account_id) {
      req.flash("error", "You must be logged in to add items to the cart.");
      return res.redirect("/account/login");
    }

    const result = await invModel.addToCart(account_id, inv_id, quantity);

    if (result) {
      req.flash("success", "Item added to cart successfully!");
    } else {
      req.flash("error", "Failed to add item to cart.");
    }

    return res.redirect("/cart");

  } catch (error) {
    console.error("❌ Error in addToCart:", error);
    req.flash("error", "An unexpected error occurred. Please try again.");
    return res.redirect("back");
  }
};


/* ****************************************
*  Build shopping cart view
* *************************************** */
invCont.buildCartView = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    const account_id = req.user?.account_id || req.user?.account_id;
    
    const cartItems = await invModel.getCartItems(account_id);
    const totalPrice = await invModel.calculateCartTotal(account_id);
    
    res.render("./cart/cart", {
      title: "Shopping Cart",
      nav,
      cartItems,
      totalPrice,
      errors: null
    });
  } catch (error) {
    console.error("Error building cart view:", error);
    next(error);
  }
};

/* ****************************************
*  Remove item from cart
* *************************************** */
invCont.removeFromCart = async function (req, res, next) {
  try {
    const { cart_item_id } = req.params;
    const account_id = req.user?.account_id || req.user?.account_id;
    
    const result = await invModel.removeFromCart(cart_item_id, account_id);
    
    if (result) {
      req.flash("notice", "Item removed from cart");
    } else {
      req.flash("notice", "Failed to remove item from cart");
    }
    res.redirect("/cart");
  } catch (error) {
    console.error("Error removing from cart:", error);
    next(error);
  }
};

/* ****************************************
*  Update cart item quantity
* *************************************** */
invCont.updateCartQuantity = async function (req, res, next) {
  try {
    const { cart_item_id, quantity } = req.body;
    const account_id = req.user?.account_id || req.user?.account_id;
    
    const result = await invModel.updateCartQuantity(cart_item_id, quantity, account_id);
    
    if (result) {
      res.json({ 
        success: true, 
        message: "Cart updated successfully"
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Failed to update cart" 
      });
    }
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    next(error);
  }
};

/* ****************************************
*  Build checkout view
* *************************************** */
invCont.buildCheckoutView = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    const account_id = req.user?.account_id || req.user?.account_id;
    
    const cartItems = await invModel.getCartItems(account_id);
    const totalPrice = await invModel.calculateCartTotal(account_id);
    
    if (!cartItems || cartItems.length === 0) {
      req.flash("notice", "Your cart is empty");
      return res.redirect("/cart");
    }
    
    res.render("./cart/checkout", {
      title: "Checkout",
      nav,
      cartItems,
      totalPrice,
      errors: null
    });
  } catch (error) {
    console.error("Error building checkout view:", error);
    next(error);
  }
};

module.exports = invCont;