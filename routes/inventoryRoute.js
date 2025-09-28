// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const classValidate = require("../utilities/classification-validation");


// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId);

// Route for a specific vehicle detail page
router.get('/detail/:vehicleId', invController.getVehicleDetail);  // Fixed the URL to `/detail/:vehicleId`

// route for inventory management view
router.get("/", utilities.handleErrors(invController.buildManagementView));

// Show form
router.get("/add-classification", utilities.handleErrors(invController.showAddClassificationForm));

// Process form submission
router.post(
  "/add-classification",
  classValidate.classificationRules(),      // validation rules
  classValidate.checkClassificationData,    // error handler middleware
  utilities.handleErrors(invController.addClassification)
);

module.exports = router;

