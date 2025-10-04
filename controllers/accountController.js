const jwt = require("jsonwebtoken") 
require("dotenv").config()
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
        errors: req.flash(),
        successMessage: req.flash("Success")
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

/* ---------- GET: Account Management View ---------- */
async function buildManagement(req, res, next) {
    const nav = await utilities.getNav()
    res.render("inventory/management", {
        title: "Account Management",
        nav,
        errors: null,
        successMessage: req.flash("success"),
        message: req.flash("message") || []
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

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  console.log("=== LOGIN ATTEMPT ===")
  console.log("Email received:", account_email)
  console.log("Password received:", account_password ? "***" : "undefined")

  const accountData = await accountModel.getAccountByEmail(account_email)
  console.log("Account found:", !!accountData)
  
  if (!accountData) {
    console.log("❌ No account found with this email")
    req.flash("notice", "Please check your credentials and try again.")
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
  }
  
  try {
    console.log("Stored hashed password:", accountData.account_password)
    console.log("Attempting password comparison...")
    
    // Store the result in a variable
    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password)
    console.log("Password match result:", passwordMatch)
    
    if (passwordMatch) {
      console.log("✅ Login successful!")
      delete accountData.account_password
      
      // Check if ACCESS_TOKEN_SECRET is set
      if (!process.env.ACCESS_TOKEN_SECRET) {
        console.error("❌ ACCESS_TOKEN_SECRET is not set in .env file")
        throw new Error("JWT secret not configured")
      }
      
      console.log("Creating JWT token...")
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      console.log("JWT token created successfully")
      
      console.log("Setting cookie...")
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      console.log("Cookie set successfully")
      
      console.log("Redirecting to /inv/management")
      return res.redirect("/inv/management")
    }
    else {
      console.log("❌ Password incorrect")
      req.flash("message notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    console.error("🔥 Login error details:", error)
    console.error("Error stack:", error.stack)
    // Don't throw another error, render the login page with error message
    req.flash("notice", "An error occurred during login. Please try again.")
    return res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
  }
}

module.exports = {
    buildLogin,
    buildRegister,
    registerAccount,
    accountLogin,
    buildManagement
}