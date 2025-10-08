const jwt = require("jsonwebtoken") 
require("dotenv").config()
const utilities = require('../utilities')
const bcrypt = require("bcryptjs")
const accountModel = require('../models/account-model')
const { validationResult } = require('express-validator')

/* ---------- GET: Login View ---------- */
async function buildLogin(req, res, next) {
    const nav = await utilities.getNav()
    let successMessage = null
    if (req.session.loginSuccess) {
        successMessage = req.session.loginSuccess
        delete req.session.loginSuccess // Clear it after displaying
    } else {
        successMessage = req.flash("success")[0] || null
    }

    // Get error messages from flash
    const errorMessage = req.flash("error")[0] || null
    res.render("account/login", {
        title: "Login",
        nav,
        errors: errorMessage ? [errorMessage] : [],   // Convert to array for template
        successMessage: successMessage || '', // Ensure it's always defined
        account_email: ''
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
    let successMessage = null
    if (req.session.loginSuccess) {
        successMessage = req.session.loginSuccess
        delete req.session.loginSuccess // Clear it after displaying
    } else {
        successMessage = req.flash("success")[0] || null
    }

    // Get the logged-in user's account data
    const account_id = res.locals.accountData.account_id;
    const accountData = await accountModel.getAccountById(account_id);

    //"account/management"
    res.render("account/management", {
        title: "Account Management",
        nav,
        errors: null,
        successMessage: successMessage,
        message: req.flash("message") || [],
        accountData: accountData
    })
}

/* ---------- GET: Update Account View ---------- */
async function buildUpdateAccount(req, res, next) {
    const nav = await utilities.getNav()
    const account_id = req.params.account_id
    
    try {
        // Get account data from database
        const accountData = await accountModel.getAccountById(account_id)
        
        if (!accountData) {
            req.flash("error", "Account not found.")
            return res.redirect("/account")
        }
        
        res.render("account/update", {
            title: "Update Account Information",
            nav,
            errors: null,
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id: accountData.account_id,
            message: req.flash("message") || []
        })
    } catch (error) {
        console.error("Error fetching account data:", error)
        req.flash("error", "Error loading account information.")
        return res.redirect("/account")
    }
}

/* ---------- POST: Update Account Information ---------- */
async function updateAccount(req, res, next) {
    const nav = await utilities.getNav()
    const { account_id, account_firstname, account_lastname, account_email } = req.body
    
    try {
        // Check if email already exists (excluding current account)
        const emailExists = await accountModel.checkEmailExcludingCurrent(account_email, account_id)
        if (emailExists) {
            const errors = validationResult(req)
            errors.errors.push({ msg: "An account with this email already exists." })
            return res.render("account/update", {
                title: "Update Account Information",
                nav,
                errors,
                account_firstname: account_firstname || '',
                account_lastname: account_lastname || '',
                account_email: account_email || '',
                account_id: account_id,
                message: []
            })
        }

        // Update account information
        const updateResult = await accountModel.updateAccount(
            account_id,
            account_firstname,
            account_lastname,
            account_email
        )

        if (updateResult) {
            // Update JWT token
            const accountData = await accountModel.getAccountById(account_id)
            delete accountData.account_password
            
            const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
            
            if(process.env.NODE_ENV === 'development') {
                res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
            } else {
                res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
            }

            req.flash("success", "Account information updated successfully!")
            return res.redirect("/account")
        } else {
            const errors = validationResult(req)
            errors.errors.push({ msg: "Sorry, the account update failed." })
            return res.render("account/update", {
                title: "Update Account Information",
                nav,
                errors,
                account_firstname: account_firstname || '',
                account_lastname: account_lastname || '',
                account_email: account_email || '',
                account_id: account_id,
                message: []
            })
        }

    } catch (error) {
        console.error("Account update error:", error)
        const errors = validationResult(req)
        errors.errors.push({ msg: "An error occurred during account update. Please try again." })
        return res.render("account/update", {
            title: "Update Account Information",
            nav,
            errors,
            account_firstname: account_firstname || '',
            account_lastname: account_lastname || '',
            account_email: account_email || '',
            account_id: account_id,
            message: []
        })
    }
}

/* ---------- POST: Change Password ---------- */
async function changePassword(req, res, next) {
    const nav = await utilities.getNav()
    const { account_id, account_password } = req.body
    
    try {
        // Hash the new password
        const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 4
        const hashedPassword = await bcrypt.hash(account_password, saltRounds)

        // Update password in database
        const updateResult = await accountModel.updatePassword(account_id, hashedPassword)

        if (updateResult) {
            req.flash("success", "Password changed successfully!")
            return res.redirect("/account")
        } else {
            const errors = validationResult(req)
            errors.errors.push({ msg: "Sorry, the password change failed." })
            return res.render("account/update", {
                title: "Update Account Information",
                nav,
                errors,
                account_firstname: '',
                account_lastname: '',
                account_email: '',
                account_id: account_id,
                message: []
            })
        }

    } catch (error) {
        console.error("Password change error:", error)
        const errors = validationResult(req)
        errors.errors.push({ msg: "An error occurred during password change. Please try again." })
        return res.render("account/update", {
            title: "Update Account Information",
            nav,
            errors,
            account_firstname: '',
            account_lastname: '',
            account_email: '',
            account_id: account_id,
            message: []
        })
    }
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
            // ✅ CHANGED: Redirect to login with success parameter
            req.flash("success", `Congratulations ${account_firstname}! Your account has been created successfully. Please log in.`)
            return res.redirect("/account/login")
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

  const accountData = await accountModel.getAccountByEmail(account_email)
  
  if (!accountData) {
    req.flash("error", "Please check your credentials and try again.")
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: req.flash(),
      account_email,
      successMessage: null
    })
  }
  
  try {
    
    // Store the result in a variable
    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password)
    
    if (passwordMatch) {
      delete accountData.account_password

      // Check if ACCESS_TOKEN_SECRET is set
      if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error("JWT secret not configured")
      }
      
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }

      // welcome message after login
      req.session.loginSuccess = `🎉 Welcome back, ${accountData.account_firstname}!`
      
      // PROPER ROLE-BASED REDIRECT:
      switch(accountData.account_type) {
        case 'Employee':
        case 'Admin':
          return res.redirect("/inv/management")
        case 'Client':
        default:
          return res.redirect("/account")
      }
    }
    else {
      req.flash("error", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: req.flash(),
        account_email,
        successMessage: null
      })
    }
  } catch (error) {
    // Don't throw another error, render the login page with error message
    req.flash("error", "An error occurred during login. Please try again.")
    return res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: req.flash(),
      account_email,
      successMessage: null
    })
  }
}

/* ---------- GET: Handle Logout ---------- */
async function accountLogout(req, res, next) {
    try {
        // Set success message BEFORE session destruction
        req.flash("success", "You have been successfully logged out.");
        
        // Clear the JWT cookie
        res.clearCookie("jwt");
        
        // Redirect to home page immediately
        return res.redirect("/");
        
    } catch (error) {
        // Clear cookie even on error
        res.clearCookie("jwt");
        return res.redirect("/");
    }
}

module.exports = {
    buildLogin,
    buildRegister,
    registerAccount,
    accountLogin,
    buildManagement,
    buildUpdateAccount,
    updateAccount,
    changePassword,
    accountLogout
}