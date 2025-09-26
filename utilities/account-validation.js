const utilities = require(".");
const { body, validationResult } = require("express-validator");

const validate = {};

validate.registrationRules = () => {
  return [
    // First Name
    body("account_firstname")
      .trim()
      .notEmpty().withMessage("Please provide a first name."),

    // Last Name
    body("account_lastname")
      .trim()
      .notEmpty().withMessage("Please provide a last name."),

    // Email
    body("account_email")
      .trim()
      .isEmail().withMessage("A valid email is required.")
      .normalizeEmail(),

    // Password - Simple with isStrongPassword
    body("account_password")
      .trim()
      .notEmpty().withMessage("Password is required.")
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }).withMessage("Password must be at least 12 characters with uppercase, lowercase, number, and special character (@$!%*?&).")
  ];
};

validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    return res.render("account/register", {
      errors,
      title: "Registration",
      nav,
      account_firstname,
      account_lastname,
      account_email,
    });
  }
  next();
};

module.exports = validate;