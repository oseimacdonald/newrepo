const utilities = require(".")  
const { body, validationResult } = require("express-validator")

const validate = {}

/* **********************************
 *  Registration Data Validation Rules
 * ********************************* */
validate.registrationRules = () => {
    return [
        body("account_firstname")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("Please provide a first name."),

        body("account_lastname")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("Please provide a last name."),

        body("account_email")
            .trim()
            .escape()
            .isEmail()
            .withMessage("A valid email is required."),

        body("account_password")
            .isStrongPassword({
                minLength: 12,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
            .withMessage("Password does not meet requirements."),
    ]
}

/* **********************************
 *  Login Data Validation Rules
 * ********************************* */
validate.loginRules = () => {
    return [
        body("account_email")
            .trim()
            .escape()
            .isEmail()
            .withMessage("A valid email is required."),

        body("account_password")
            .notEmpty()
            .withMessage("Password is required."),
    ]
}

/* **********************************
 *  Update Account Data Validation Rules
 * ********************************* */
validate.updateAccountRules = () => {
    return [
        body("account_firstname")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("Please provide a first name."),

        body("account_lastname")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("Please provide a last name."),

        body("account_email")
            .trim()
            .escape()
            .isEmail()
            .withMessage("A valid email is required."),
    ]
}

/* **********************************
 *  Password Update Validation Rules
 * ********************************* */
validate.passwordUpdateRules = () => {
    return [
        body("account_password")
            .isStrongPassword({
                minLength: 12,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
            .withMessage("Password does not meet requirements."),
    ]
}

/* ******************************
 * Check registration data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
    const errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        const { account_firstname, account_lastname, account_email } = req.body
        const nav = await utilities.getNav()
        
        return res.render("account/register", {
            errors,
            title: "Register",
            nav,
            account_firstname: account_firstname || '',
            account_lastname: account_lastname || '',
            account_email: account_email || ''
        })
    }
    next()
}

/* ******************************
 * Check login data and return errors or continue to login
 * ***************************** */
validate.checkLoginData = async (req, res, next) => {
    const errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        const { account_email } = req.body
        const nav = await utilities.getNav()
        
        return res.render("account/login", {
            errors,
            title: "Login",
            nav,
            account_email: account_email || ''
        })
    }
    next()
}

/* ******************************
 * Check account update data and return errors or continue
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
    const errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        const { account_id, account_firstname, account_lastname, account_email } = req.body
        const nav = await utilities.getNav()
        
        return res.render("account/update", {
            errors,
            title: "Update Account Information",
            nav,
            account_firstname: account_firstname || '',
            account_lastname: account_lastname || '',
            account_email: account_email || '',
            account_id: account_id || ''
        })
    }
    next()
}

/* ******************************
 * Check password update data and return errors or continue
 * ***************************** */
validate.checkPasswordData = async (req, res, next) => {
    const errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        const { account_id } = req.body
        const nav = await utilities.getNav()
        
        return res.render("account/update", {
            errors,
            title: "Update Account Information",
            nav,
            account_firstname: '',
            account_lastname: '',
            account_email: '',
            account_id: account_id || ''
        })
    }
    next()
}

module.exports = validate