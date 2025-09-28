const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

/* *******************************************************
*  Controller function to fetch and render the vehicle detail view
*  ****************************************************** */
invCont.getVehicleDetail = async (req, res) => {
  const vehicleId = req.params.vehicleId;

  try {
    const vehicleData = await invModel.getVehicleById(vehicleId);

    if (vehicleData) {
      const nav = await utilities.getNav();

      res.render('inventory/vehicle-detail', {
        title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
        nav,
        vehicleData
      });
    } else {
      res.status(404).send('Vehicle not found');
    }
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    res.status(500).send('Error fetching vehicle details');
  }
};

// Management view control
invCont.buildManagementView = async function (req, res) {
  let nav = await utilities.getNav(); 
  res.render("inventory/management", {
    title: "Inventory Management",
    nav,
    message: req.flash("message"), // this enables message display
  });
};


// Show form
invCont.showAddClassificationForm = async function (req, res) {
  const nav = await utilities.getNav();
  res.render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    message: req.flash("message")
  });
};

// Handle POST
invCont.addClassification = async function (req, res) {
  const { classification_name } = req.body;
  const nav = await utilities.getNav();

  try {
    const result = await invModel.addClassification(classification_name);

    if (result) {
      req.flash("message", "New classification added successfully.");
      const updatedNav = await utilities.getNav(); // reflect new nav
      res.render("inventory/management", {
        title: "Inventory Management",
        nav: updatedNav,
        message: req.flash("message")
      });
    } else {
      req.flash("message", "Failed to add classification.");
      res.status(500).render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        message: req.flash("message"),
        classification_name
      });
    }
  } catch (err) {
    console.error("Add classification error:", err);
    req.flash("message", "An error occurred.");
    res.status(500).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      message: req.flash("message"),
      classification_name
    });
  }
};

module.exports = invCont;



