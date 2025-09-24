// Needed Resources 
const express = require("express")
const router = new express.Router() 
const accountController = require("../controllers/accountController")
const utilities = require("../utilities")

// Deliver login view
router.get("/login", utilities.handleErrors(accountController.buildLogin))

// Deliver registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister))

// Handle registration form submission
router.post("/register", utilities.handleErrors(accountController.registerAccount))

// login post route
router.post("/login", utilities.handleErrors(accountController.accountLogin))

module.exports = router