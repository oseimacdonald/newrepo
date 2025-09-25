const utilities = require('../utilities')
const bcrypt = require("bcryptjs")
const accountModel = require('../models/account-model')

/* ---------- Password Validation Helper ---------- */
function validatePassword(password) {
    const errors = []

    if (password.length < 12) {
        errors.push("Password must be at least 12 characters long")
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter")
    }
    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number")
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push("Password must contain at least one special character (@$!%*?&)")
    }

    return errors
}

/* ---------- GET: Login View ---------- */
async function buildLogin(req, res, next) {
    const nav = await utilities.getNav()
    // Removed explicit req.flash() call here to avoid consuming flash messages early
    res.render("account/login", {
        title: "Login",
        nav,
        // messages will be available in the view as res.locals.messages by middleware
    })
}

/* ---------- GET: Register View ---------- */
async function buildRegister(req, res, next) {
    const nav = await utilities.getNav()
    // Removed explicit req.flash() call here as well
    res.render("account/register", {
        title: "Register",
        nav,
        account_firstname: req.body?.account_firstname || '',
        account_lastname: req.body?.account_lastname || '',
        account_email: req.body?.account_email || ''
        // messages available via res.locals.messages in views
    })
}

/* ---------- POST: Handle Registration ---------- */
async function registerAccount(req, res, next) {
    try {
        const { account_firstname, account_lastname, account_email, account_password } = req.body

        // Validation: Required fields
        if (!account_firstname || !account_lastname || !account_email || !account_password) {
            req.flash("notice", "Please fill in all required fields.")
            return res.redirect("/account/register")
        }

        // Validation: Password strength
        const passwordErrors = validatePassword(account_password)
        if (passwordErrors.length > 0) {
            req.flash("notice", passwordErrors)
            return res.redirect("/account/register")
        }

        // Validation: Duplicate email
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

/* ---------- Export Controllers ---------- */
module.exports = {
    buildLogin,
    buildRegister,
    registerAccount,
    accountLogin
}
