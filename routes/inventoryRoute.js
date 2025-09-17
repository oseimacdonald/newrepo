// Needed Resources
const express = require("express")
const route = new express.Router()
const invController = require("../controllers/invController")
const router = require("./static")
// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId);

module.exports = router;