// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const classValidate = require("../utilities/classification-validation");

// Import inventory validation
const {
  inventoryRules,
  checkInventoryData
} = require("../utilities/inventory-validation");

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
router.get("/add-inventory", invController.showAddInventoryForm);

// Route to handle POST for adding vehicle - FIXED
router.post(
  "/add-inventory",
  inventoryRules(), // Validation rules
  checkInventoryData, // Validation middleware (from inventory-validation.js)
  invController.addInventory // Controller
);

module.exports = router;