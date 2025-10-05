const express = require("express")
const router = express.Router()
const accountController = require("../controllers/accountController")
const utilities = require("../utilities")
const regValidate = require('../utilities/account-validation')

router.get("/login", utilities.handleErrors(accountController.buildLogin))
router.get("/register", utilities.handleErrors(accountController.buildRegister))
// Logout route
router.get("/logout", utilities.handleErrors(accountController.accountLogout));
// Account Management with login check
router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildManagement))

// Update Account route - GET
router.get("/update/:account_id", utilities.checkLogin, utilities.handleErrors(accountController.buildUpdateAccount))

// Update Account Information - POST
router.post(
    "/update",
    utilities.checkLogin,
    regValidate.updateAccountRules(),
    regValidate.checkUpdateData,
    utilities.handleErrors(accountController.updateAccount)
)

// Change Password - POST
router.post(
    "/change-password",
    utilities.checkLogin,
    regValidate.passwordUpdateRules(),
    regValidate.checkPasswordData,
    utilities.handleErrors(accountController.changePassword)
)

router.post(
    "/register",
    regValidate.registrationRules(),
    regValidate.checkRegData,
    utilities.handleErrors(accountController.registerAccount)
)

router.post(
    "/login",
    regValidate.loginRules(),
    regValidate.checkLoginData,
    utilities.handleErrors(accountController.accountLogin)
)

module.exports = router