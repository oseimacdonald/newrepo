const jwt = require('jsonwebtoken');
const utilities = require('../utilities');

const authMiddleware = {};

/* **********************************
 * JWT Verification Middleware
 * ********************************* */
authMiddleware.verifyJWT = async (req, res, next) => {
    const token = req.cookies.jwt;
    console.log("🧪 Received JWT token:", token); // ← LOG received token

    if (!token) {
        console.log("❌ No JWT token found in cookies"); // ← LOG missing token
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
        console.log("✅ JWT decoded successfully:", decoded); // ← LOG decoded token

        req.user = decoded;
        res.locals.user = decoded; // Make user available to views
        next();
    } catch (error) {
        console.error("❌ JWT verification failed:", error.message); // ← LOG error details
        const nav = await utilities.getNav();
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

// Alias for checkLogin if used elsewhere
authMiddleware.checkLogin = authMiddleware.verifyJWT;

/* **********************************
 * Employee/Admin Authorization Middleware
 * ********************************* */
authMiddleware.requireEmployeeOrAdmin = async (req, res, next) => {
    if (!req.user || (req.user.account_type !== 'Employee' && req.user.account_type !== 'Admin')) {
        console.log("❌ Access denied: Not Employee or Admin"); // ← LOG access denial
        const nav = await utilities.getNav();
        return res.status(403).render("account/login", {
            title: "Login",
            nav,
            errors: null,
            account_email: '',
            message: "Access denied. Employee or Admin privileges required."
        });
    }

    console.log("✅ User authorized as Employee/Admin:", req.user.account_type); // ← LOG success
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
