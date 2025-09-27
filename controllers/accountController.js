const utilities = require('../utilities')
const bcrypt = require("bcryptjs")
const accountModel = require('../models/account-model')
const { validationResult } = require('express-validator')

/* ---------- GET: Login View ---------- */
async function buildLogin(req, res, next) {
    const nav = await utilities.getNav()
    res.render("account/login", {
        title: "Login",
        nav,
        errors: null
    })
}

/* ---------- GET: Register View ---------- */
async function buildRegister(req, res, next) {
    const nav = await utilities.getNav()
    res.render("account/register", {
        title: "Register",
        nav,
        errors: null,
        account_firstname: '',
        account_lastname: '',
        account_email: ''
    })
}

/* ---------- POST: Handle Registration ---------- */
async function registerAccount(req, res, next) {
    try {
        const nav = await utilities.getNav()
        const { account_firstname, account_lastname, account_email, account_password } = req.body

        // Check for duplicate email
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists) {
            const errors = validationResult(req)
            errors.errors.push({ msg: "An account with this email already exists." })
            return res.render("account/register", {
                title: "Register",
                nav,
                errors,
                account_firstname: account_firstname || '',
                account_lastname: account_lastname || '',
                account_email: account_email || ''
            })
        }

        // Hash password
        const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 4
        const hashedPassword = await bcrypt.hash(account_password, saltRounds)

        // Register the account
        const regResult = await accountModel.registerAccount(
            account_firstname,
            account_lastname,
            account_email,
            hashedPassword
        )

        if (regResult && regResult.rows && regResult.rows.length > 0) {
            // Show success message on login page
            return res.render("account/login", {
                title: "Login",
                nav,
                errors: null,
                successMessage: `Congratulations ${account_firstname}! Your account has been created successfully. Please log in.`
            })
        } else {
            const errors = validationResult(req)
            errors.errors.push({ msg: "Sorry, the registration failed." })
            return res.render("account/register", {
                title: "Register",
                nav,
                errors,
                account_firstname: account_firstname || '',
                account_lastname: account_lastname || '',
                account_email: account_email || ''
            })
        }

    } catch (error) {
        console.error("Registration error:", error)
        const nav = await utilities.getNav()
        const errors = validationResult(req)
        errors.errors.push({ msg: "An error occurred during registration. Please try again." })
        return res.render("account/register", {
            title: "Register",
            nav,
            errors,
            account_firstname: req.body.account_firstname || '',
            account_lastname: req.body.account_lastname || '',
            account_email: req.body.account_email || ''
        })
    }
}

/* ---------- POST: Login (Stub) ---------- */
async function accountLogin(req, res, next) {
    return res.redirect("/account/login")
}

module.exports = {
    buildLogin,
    buildRegister,
    registerAccount,
    accountLogin
}