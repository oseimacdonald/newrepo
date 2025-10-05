const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities");
const classValidate = require("../utilities/classification-validation");
const authMiddleware = require('../middleware/authMiddleware');

// Import inventory validation
const {
  inventoryRules,
  checkInventoryData,
  checkUpdateData
} = require("../utilities/inventory-validation");

// ==================== PUBLIC ROUTES ====================
// Route to browse ALL vehicles (public - no login required)
router.get("/", utilities.handleErrors(invController.buildByClassification));

// Route to build inventory by classification view (public)
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route for a specific vehicle detail page (public)
router.get('/detail/:vehicleId', utilities.handleErrors(invController.getVehicleDetail));

// ==================== PROTECTED ROUTES ====================
// Route for inventory management view (Employee/Admin only)
router.get("/management", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.buildManagement)
);

// Route to get inventory data for management (AJAX) (Employee/Admin only)
router.get("/getInventory/:classification_id", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.getInventoryJSON)
);

// Route to show edit inventory form (Employee/Admin only)
router.get("/edit/:inv_id", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.editInventoryView)
);

// Route to handle inventory updates (Employee/Admin only)
router.post("/update", 
  authMiddleware.requireInventoryAccess,
  inventoryRules(),
  checkUpdateData,
  utilities.handleErrors(invController.updateInventory)
);

// Show Add Classification Form (Employee/Admin only)
router.get("/add-classification", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.showAddClassificationForm)
);

// Process Classification Form Submission (Employee/Admin only)
router.post(
  "/add-classification",
  authMiddleware.requireInventoryAccess,
  classValidate.classificationRules(),
  classValidate.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
);

// Show Add Inventory Form (Employee/Admin only)
router.get("/add-inventory", 
  authMiddleware.requireInventoryAccess, 
  utilities.handleErrors(invController.showAddInventoryForm)
);

// Route to handle POST for adding vehicle (Employee/Admin only)
router.post(
  "/add-inventory",
  authMiddleware.requireInventoryAccess,
  inventoryRules(),
  checkInventoryData,
  utilities.handleErrors(invController.addInventory)
);

module.exports = router;