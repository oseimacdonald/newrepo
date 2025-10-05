/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const session = require("express-session")
const flash = require('connect-flash')
const cookieParser = require("cookie-parser")
const compression = require('compression')
const env = require("dotenv").config()
const utilities = require("./utilities/")
const baseController = require("./controllers/baseController")
const static = require("./routes/static")
const inventoryRoute = require("./routes/inventoryRoute")
const errorRoute = require("./routes/errorRoute")
const pool = require('./database/')
const handleError = require("./middleware/errorHandler")
const jwt = require("jsonwebtoken")
const app = express()

/* ***********************
 * Middleware Setup
 *************************/

// 1. Compression
app.use(compression())

// 2. Static files
app.use(express.static('public'))

// 3. Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 4. Session middleware
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_in_production',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true
  }
}))

// 5. Cookie parser
app.use(cookieParser())

// 6. Flash middleware
app.use(flash())

// 7. Global User Middleware - This handles JWT tokens for ALL routes
app.use(async (req, res, next) => {
  // Make flash messages available to all templates
  res.locals.messages = req.flash()
  res.locals.session = req.session
  
  // JWT Token Verification for template variables
  const token = req.cookies.jwt;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      res.locals.accountData = decoded; // Use accountData for consistency
      res.locals.loggedin = 1;
      req.accountData = decoded;
    } catch (error) {
      console.error("JWT verification error:", error.message);
      res.locals.accountData = null;
      res.locals.loggedin = 0;
      res.clearCookie('jwt');
    }
  } else {
    res.locals.accountData = null;
    res.locals.loggedin = 0;
  }
  next();
});

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "layouts/layout")

/* ***********************
 * Routes
 *************************/
// Static routes
app.use(static)

// Index route
app.get("/", baseController.buildHome)

// Inventory routes
app.use("/inv", inventoryRoute)

// Account routes
app.use("/account", require("./routes/accountRoute"))

// Error routes
app.use("/error", errorRoute)

/* ***********************
 * Error Handling Middleware
 *************************/

// 404 handler
app.use(async (req, res) => {
  const nav = await utilities.getNav()
  res.status(404).render("error", {
    title: "404 Not Found",
    nav,
    message: "The page you're looking for does not exist.",
  })
})

// Global error handler
app.use(handleError)

/* ***********************
 * Server Configuration
 *************************/
const port = process.env.PORT || 5500
const host = process.env.HOST || 'localhost'

app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})