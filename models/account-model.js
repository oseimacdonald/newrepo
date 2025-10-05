const pool = require("../database/")

/* *****************************
* Register new account
* ***************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password){
  try {
    const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *"
    return await pool.query(sql, [account_firstname, account_lastname, account_email, account_password])
  } catch (error) {
    return error.message
  }
}

/* *****************************
* Return account data using account ID
* ***************************** */
async function getAccountById(account_id) {
  try {
    const sql = "SELECT account_id, account_firstname, account_lastname, account_email, account_type FROM account WHERE account_id = $1"
    const result = await pool.query(sql, [account_id])
    return result.rows[0]
  } catch (error) {
    throw new Error("No matching account found")
  }
}

/* *****************************
* Check if email already exists
* ***************************** */
async function checkExistingEmail(account_email){
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email = await pool.query(sql, [account_email])
    return email.rowCount
  } catch (error) {
    return error.message
  }
}

/* *****************************
* Check if email exists excluding current account
* ***************************** */
async function checkEmailExcludingCurrent(account_email, account_id) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1 AND account_id != $2"
    const email = await pool.query(sql, [account_email, account_id])
    return email.rowCount
  } catch (error) {
    return error.message
  }
}

/* *****************************
* Update account information (first name, last name, email)
* ***************************** */
async function updateAccount(account_id, account_firstname, account_lastname, account_email) {
  try {
    const sql = "UPDATE account SET account_firstname = $1, account_lastname = $2, account_email = $3 WHERE account_id = $4 RETURNING *"
    const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_id])
    return result.rowCount > 0
  } catch (error) {
    console.error("Update account error:", error)
    return false
  }
}

/* *****************************
* Update account password
* ***************************** */
async function updatePassword(account_id, account_password) {
  try {
    const sql = "UPDATE account SET account_password = $1 WHERE account_id = $2 RETURNING *"
    const result = await pool.query(sql, [account_password, account_id])
    return result.rowCount > 0
  } catch (error) {
    console.error("Update password error:", error)
    return false
  }
}

/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = "SELECT account_id, account_firstname, account_lastname, account_email, account_password, account_type FROM account WHERE account_email = $1"
    const result = await pool.query(sql, [account_email])
    return result.rows[0]
  } catch (error) {
    throw new Error("No matching email found")
  }
}

module.exports = { 
  registerAccount, 
  checkExistingEmail, 
  checkEmailExcludingCurrent,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword
}