const jwt = require('jsonwebtoken');
const utilities = require('../utilities');

const authMiddleware = {};

/* **********************************
 * JWT Verification Middleware
 * ********************************* */
authMiddleware.verifyJWT = async (req, res, next) => {
    const token = req.cookies.jwt; // Using "jwt" cookie based on your login code

    if (!token) {
        const nav = await utilities.getNav();
        return res.status(401).render("account/login", {
            title: "Login",
            nav,
            errors: null,
            account_email: '',
            message: "Please log in to access this page."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        res.locals.user = decoded; // Make user available to views
        next();
    } catch (error) {
        console.error("JWT verification error:", error);
        const nav = await utilities.getNav();
        // Clear invalid token
        res.clearCookie("jwt");
        return res.status(401).render("account/login", {
            title: "Login",
            nav,
            errors: null,
            account_email: '',
            message: "Session expired. Please log in again."
        });
    }
};

// Alias for verifyJWT to maintain backward compatibility or preferred naming
authMiddleware.checkLogin = authMiddleware.verifyJWT;

/* **********************************
 * Employee/Admin Authorization Middleware
 * ********************************* */
authMiddleware.requireEmployeeOrAdmin = async (req, res, next) => {
    if (!req.user || (req.user.account_type !== 'Employee' && req.user.account_type !== 'Admin')) {
        const nav = await utilities.getNav();
        return res.status(403).render("account/login", {
            title: "Login",
            nav,
            errors: null,
            account_email: '',
            message: "Access denied. Employee or Admin privileges required."
        });
    }
    next();
};

/* **********************************
 * Combined Auth Middleware for Inventory Management
 * ********************************* */
authMiddleware.requireInventoryAccess = [
    authMiddleware.verifyJWT,
    authMiddleware.requireEmployeeOrAdmin
];

module.exports = authMiddleware;
