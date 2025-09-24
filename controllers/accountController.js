// account controller
const utilities = require('../utilities')
const bcrypt = require("bcryptjs")
const pool = require('../database/')

// Deliver login view
async function buildLogin(req, res, next) {
    let nav = await utilities.getNav()
    res.render("account/login", {
        title: "Login",
        nav,
    })
}

// Deliver registration view
async function buildRegister(req, res, next) {
    let nav = await utilities.getNav()
    res.render("account/register", {
        title: "Register",
        nav,
        errors: null,
    })
}

// Handle account registration
async function registerAccount(req, res, next) {
    try {
        const { account_firstname, account_lastname, account_email, account_password } = req.body;

        // Basic validation
        if (!account_firstname || !account_lastname || !account_email || !account_password) {
            req.flash("notice", "Please fill in all required fields.");
            return res.redirect("/account/register");
        }

        // Check if email already exists
        const existingUser = await pool.query(
            "SELECT * FROM account WHERE account_email = $1",
            [account_email]
        );
        
        if (existingUser.rows.length > 0) {
            req.flash("notice", "An account with this email already exists.");
            return res.redirect("/account/register");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(account_password, 10);

        // Insert new user into database
        const result = await pool.query(
            `INSERT INTO account (account_firstname, account_lastname, account_email, account_password)
             VALUES ($1, $2, $3, $4) RETURNING account_id`,
            [account_firstname, account_lastname, account_email, hashedPassword]
        );

        if (result.rows.length > 0) {
            req.flash("notice", "Registration successful. Please log in.");
            return res.redirect("/account/login");
        } else {
            req.flash("notice", "Registration failed. Please try again.");
            return res.redirect("/account/register");
        }
    } catch (error) {
        console.error("Registration error:", error);
        req.flash("notice", "Registration error. Please try again.");
        return res.redirect("/account/register");
    }
}

module.exports = { buildLogin, buildRegister, registerAccount }