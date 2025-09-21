// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId);

// Route for a specific vehicle detail page
router.get('/detail/:vehicleId', invController.getVehicleDetail);  // Fixed the URL to `/detail/:vehicleId`

module.exports = router;