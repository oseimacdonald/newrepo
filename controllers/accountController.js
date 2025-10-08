const jwt = require("jsonwebtoken") 
require("dotenv").config()

// Get JWT secret from multiple possible sources
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || process.env.TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  console.error('⚠️  WARNING: No JWT secret found in environment variables')
  console.log('Login functionality will not work until JWT secret is set')
} else {
  console.log('✅ JWT secret is configured')
}

const utilities = require('../utilities')
const bcrypt = require("bcryptjs")
const accountModel = require('../models/account-model')
const { validationResult } = require('express-validator')

/* ---------- Utility Functions ---------- */
const getSuccessMessage = (req) => {
  if (req.session.loginSuccess) {
    const message = req.session.loginSuccess;
    delete req.session.loginSuccess;
    return message;
  }
  return req.flash("success")[0] || null;
};

const renderLogin = (res, nav, options = {}) => {
  const {
    title = "Login",
    errors = [],
    account_email = '',
    successMessage = ''
  } = options;

  res.render("account/login", {
    title,
    nav,
    errors,
    successMessage,
    account_email
  });
};

/* ---------- GET: Login View ---------- */
async function buildLogin(req, res, next) {
  const nav = await utilities.getNav();
  const successMessage = getSuccessMessage(req);
  const errorMessage = req.flash("error")[0] || null;

  renderLogin(res, nav, {
    errors: errorMessage ? [errorMessage] : [],
    successMessage: successMessage || '',
    account_email: ''
  });
}

/* ---------- GET: Register View ---------- */
async function buildRegister(req, res, next) {
  const nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
    account_firstname: '',
    account_lastname: '',
    account_email: ''
  });
}

/* ---------- GET: Account Management View ---------- */
async function buildManagement(req, res, next) {
  const nav = await utilities.getNav();
  const successMessage = getSuccessMessage(req);
  const account_id = res.locals.accountData.account_id;
  const accountData = await accountModel.getAccountById(account_id);

  res.render("account/management", {
    title: "Account Management",
    nav,
    errors: null,
    successMessage,
    message: req.flash("message") || [],
    accountData: accountData
  });
}

/* ---------- GET: Update Account View ---------- */
async function buildUpdateAccount(req, res, next) {
  const nav = await utilities.getNav();
  const account_id = req.params.account_id;

  try {
    const accountData = await accountModel.getAccountById(account_id);

    if (!accountData) {
      req.flash("error", "Account not found.");
      return res.redirect("/account");
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
    });
  } catch (error) {
    console.error("Error fetching account data:", error);
    req.flash("error", "Error loading account information.");
    res.redirect("/account");
  }
}

/* ---------- POST: Update Account Information ---------- */
async function updateAccount(req, res, next) {
  const nav = await utilities.getNav();
  const { account_id, account_firstname, account_lastname, account_email } = req.body;

  try {
    // Check if JWT secret is available
    if (!ACCESS_TOKEN_SECRET) {
      req.flash("error", "Server configuration error. Please try again later.");
      return res.redirect("/account");
    }

    const emailExists = await accountModel.checkEmailExcludingCurrent(account_email, account_id);
    if (emailExists) {
      const errors = validationResult(req);
      errors.errors.push({ msg: "An account with this email already exists." });
      return res.render("account/update", {
        title: "Update Account Information",
        nav,
        errors,
        account_firstname: account_firstname || '',
        account_lastname: account_lastname || '',
        account_email: account_email || '',
        account_id: account_id,
        message: []
      });
    }

    const updateResult = await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email
    );

    if (updateResult) {
      const accountData = await accountModel.getAccountById(account_id);
      delete accountData.account_password;
      
      const accessToken = jwt.sign(accountData, ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 });
      
      const cookieOptions = {
        httpOnly: true,
        maxAge: 3600 * 1000
      };

      if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
      }

      res.cookie("jwt", accessToken, cookieOptions);
      req.flash("success", "Account information updated successfully!");
      return res.redirect("/account");
    } else {
      const errors = validationResult(req);
      errors.errors.push({ msg: "Sorry, the account update failed." });
      return res.render("account/update", {
        title: "Update Account Information",
        nav,
        errors,
        account_firstname: account_firstname || '',
        account_lastname: account_lastname || '',
        account_email: account_email || '',
        account_id: account_id,
        message: []
      });
    }
  } catch (error) {
    console.error("Account update error:", error);
    const errors = validationResult(req);
    errors.errors.push({ msg: "An error occurred during account update. Please try again." });
    return res.render("account/update", {
      title: "Update Account Information",
      nav,
      errors,
      account_firstname: account_firstname || '',
      account_lastname: account_lastname || '',
      account_email: account_email || '',
      account_id: account_id,
      message: []
    });
  }
}

/* ---------- POST: Change Password ---------- */
async function changePassword(req, res, next) {
  const nav = await utilities.getNav();
  const { account_id, account_password } = req.body;

  try {
    const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 4;
    const hashedPassword = await bcrypt.hash(account_password, saltRounds);
    const updateResult = await accountModel.updatePassword(account_id, hashedPassword);

    if (updateResult) {
      req.flash("success", "Password changed successfully!");
      return res.redirect("/account");
    } else {
      const errors = validationResult(req);
      errors.errors.push({ msg: "Sorry, the password change failed." });
      return res.render("account/update", {
        title: "Update Account Information",
        nav,
        errors,
        account_firstname: '',
        account_lastname: '',
        account_email: '',
        account_id: account_id,
        message: []
      });
    }
  } catch (error) {
    console.error("Password change error:", error);
    const errors = validationResult(req);
    errors.errors.push({ msg: "An error occurred during password change. Please try again." });
    return res.render("account/update", {
      title: "Update Account Information",
      nav,
      errors,
      account_firstname: '',
      account_lastname: '',
      account_email: '',
      account_id: account_id,
      message: []
    });
  }
}

/* ---------- POST: Handle Registration ---------- */
async function registerAccount(req, res, next) {
  const nav = await utilities.getNav();
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  try {
    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists) {
      const errors = validationResult(req);
      errors.errors.push({ msg: "An account with this email already exists." });
      return res.render("account/register", {
        title: "Register",
        nav,
        errors,
        account_firstname: account_firstname || '',
        account_lastname: account_lastname || '',
        account_email: account_email || ''
      });
    }

    const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 4;
    const hashedPassword = await bcrypt.hash(account_password, saltRounds);

    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    );

    if (regResult?.rows?.length > 0) {
      req.flash("success", `Congratulations ${account_firstname}! Your account has been created successfully. Please log in.`);
      return res.redirect("/account/login");
    } else {
      const errors = validationResult(req);
      errors.errors.push({ msg: "Sorry, the registration failed." });
      return res.render("account/register", {
        title: "Register",
        nav,
        errors,
        account_firstname: account_firstname || '',
        account_lastname: account_lastname || '',
        account_email: account_email || ''
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    const errors = validationResult(req);
    errors.errors.push({ msg: "An error occurred during registration. Please try again." });
    return res.render("account/register", {
      title: "Register",
      nav,
      errors,
      account_firstname: req.body.account_firstname || '',
      account_lastname: req.body.account_lastname || '',
      account_email: req.body.account_email || ''
    });
  }
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body;

  try {
    // Check if JWT secret is available
    if (!ACCESS_TOKEN_SECRET) {
      req.flash("error", "Server configuration error. Please try again later.");
      return res.status(500).render("account/login", {
        title: "Login",
        nav,
        errors: req.flash(),
        account_email,
        successMessage: null
      });
    }

    const accountData = await accountModel.getAccountByEmail(account_email);

    if (!accountData) {
      req.flash("error", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: req.flash(),
        account_email,
        successMessage: null
      });
    }

    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);

    if (passwordMatch) {
      delete accountData.account_password;

      const accessToken = jwt.sign(accountData, ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 });

      const cookieOptions = {
        httpOnly: true,
        maxAge: 3600 * 1000
      };

      if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
      }

      res.cookie("jwt", accessToken, cookieOptions);
      req.session.loginSuccess = `🎉 Welcome back, ${accountData.account_firstname}!`;

      // Role-based redirect
      if (['Employee', 'Admin'].includes(accountData.account_type)) {
        return res.redirect("/inv/management");
      } else {
        return res.redirect("/account");
      }
    } else {
      req.flash("error", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: req.flash(),
        account_email,
        successMessage: null
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    req.flash("error", "An error occurred during login. Please try again.");
    return res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: req.flash(),
      account_email,
      successMessage: null
    });
  }
}

/* ---------- GET: Handle Logout ---------- */
async function accountLogout(req, res, next) {
  try {
    req.flash("success", "You have been successfully logged out.");
    
    const cookieOptions = {
      httpOnly: true
    };
    
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'none';
    }
    
    res.clearCookie("jwt", cookieOptions);
    return res.redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
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