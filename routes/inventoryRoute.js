// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const classValidate = require("../utilities/classification-validation");
const inventoryValidation = require("../utilities/inventory-validation"); // Added for inventory validation

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route for a specific vehicle detail page
router.get('/detail/:vehicleId', utilities.handleErrors(invController.getVehicleDetail));

// Route for inventory management view
router.get("/", utilities.handleErrors(invController.buildManagementView));

// Show Add Classification Form
router.get("/add-classification", utilities.handleErrors(invController.showAddClassificationForm));

// Process Classification Form Submission
router.post(
  "/add-classification",
  classValidate.classificationRules(),
  classValidate.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
);

// Show Add Inventory Form
router.get(
  "/add-inventory",
  utilities.handleErrors(invController.showAddInventoryForm)
);

// Handle Inventory Form Submission
router.post(
  "/add-inventory",
  inventoryValidation.inventoryRules(),
  inventoryValidation.checkInventoryData,
  utilities.handleErrors(invController.addInventory)
);

module.exports = router;