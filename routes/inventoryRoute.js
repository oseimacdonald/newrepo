// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const classValidate = require("../utilities/classification-validation");
const authMiddleware = require('../middleware/authMiddleware');

// Import inventory validation
const {
  inventoryRules,
  checkInventoryData,
  checkUpdateData
} = require("../utilities/inventory-validation");

// Public routes (no authentication required)
// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route for a specific vehicle detail page
router.get('/detail/:vehicleId', utilities.handleErrors(invController.getVehicleDetail));

// Protected routes (require Employee or Admin privileges)
// Default inventory route
router.get("/", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.buildManagement)
);

// Route for inventory management view
router.get("/management", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.buildManagement)
);

// Route to get inventory data for management (AJAX)
router.get("/getInventory/:classification_id", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.getInventoryJSON)
);

// Route to show edit inventory form
router.get("/edit/:inv_id", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.editInventoryView)
);

// Route to handle inventory updates
router.post("/update", 
  authMiddleware.requireInventoryAccess,
  inventoryRules(),
  checkUpdateData,
  utilities.handleErrors(invController.updateInventory)
);

// Show Add Classification Form
router.get("/add-classification", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.showAddClassificationForm)
);

// Process Classification Form Submission
router.post(
  "/add-classification",
  authMiddleware.requireInventoryAccess,
  classValidate.classificationRules(),
  classValidate.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
);

// Show Add Inventory Form
router.get("/add-inventory", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.showAddInventoryForm)
);

// Route to handle POST for adding vehicle
router.post(
  "/add-inventory",
  authMiddleware.requireInventoryAccess,
  inventoryRules(),
  checkInventoryData,
  utilities.handleErrors(invController.addInventory)
);

module.exports = router;