const utilities = require('../utilities')
const bcrypt = require("bcryptjs")
const accountModel = require('../models/account-model')

/* ---------- GET: Login View ---------- */
async function buildLogin(req, res, next) {
    const nav = await utilities.getNav()
    // 🎯 Check if this is a reload and clear flash messages
    const isReload = req.headers['cache-control'] === 'max-age=0' || 
                    req.headers['pragma'] === 'no-cache';
    
    if (isReload) {
        // Clear flash messages on reload
        req.session.flash = {}; // This depends on your session setup
    }
    res.render("account/login", {
        title: "Login",
        nav,
    })
}

/* ---------- GET: Register View ---------- */
async function buildRegister(req, res, next) {
    const nav = await utilities.getNav()
    res.render("account/register", {
        title: "Register",
        nav,
        errors: null,
    })
}

// Error handling
function handleErrors(controllerFunction) {
  return async function (req, res, next) {
    try {
      await controllerFunction(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

/* ---------- POST: Handle Registration ---------- */
async function registerAccount(req, res, next) {
    try {
        const { account_firstname, account_lastname, account_email, account_password } = req.body

        // Only check for duplicate email (validation handled by middleware)
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists) {
            req.flash("notice", "An account with this email already exists.")
            return res.redirect("/account/register")
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
            req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`)
            return res.redirect("/account/login")
        } else {
            req.flash("notice", "Sorry, the registration failed.")
            return res.redirect("/account/register")
        }

    } catch (error) {
        console.error("Registration error:", error)
        req.flash("notice", "An error occurred during registration. Please try again.")
        return res.redirect("/account/register")
    }
}

/* ---------- POST: Login (Stub) ---------- */
async function accountLogin(req, res, next) {
    req.flash("notice", "Login functionality coming soon!")
    return res.redirect("/account/login")
}

module.exports = {
    buildLogin,
    buildRegister,
    registerAccount,
    accountLogin,
    handleErrors
}