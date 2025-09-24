const bcrypt = require("bcryptjs")  // For password hashing
const pool = require("../database")  // Your PostgreSQL pool connection

// Registration handler
async function registerAccount(req, res, next) {
  try {
    const { account_firstname, account_lastname, account_email, account_password } = req.body;

    // Basic validation example (expand as needed)
    if (!account_firstname || !account_lastname || !account_email || !account_password) {
      req.flash("notice", "Please fill in all required fields.");
      return res.redirect("/account/register");
    }

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT * FROM accounts WHERE account_email = $1",
      [account_email]
    );
    if (existingUser.rows.length > 0) {
      req.flash("notice", "An account with this email already exists.");
      return res.redirect("/account/register");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(account_password, 10);

    // Insert new user into database
    const insertUser = await pool.query(
      `INSERT INTO accounts (account_firstname, account_lastname, account_email, account_password)
       VALUES ($1, $2, $3, $4) RETURNING account_id`,
      [account_firstname, account_lastname, account_email, hashedPassword]
    );

    if (insertUser.rowCount === 1) {
      req.flash("notice", "Registration successful. Please log in.");
      return res.redirect("/account/login");
    } else {
      req.flash("notice", "Registration failed. Please try again.");
      return res.redirect("/account/register");
    }
  } catch (error) {
    return next(error);
  }
}

module.exports = { buildLogin, buildRegister, registerAccount };
