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
const cookieParser = require("cookie-parser")
const app = express()

/* ***********************
 * Middleware Setup
 * IMPORTANT: Order matters!
 *************************/

// 1. Compression (first - should compress all responses)
app.use(compression())

// 2. Static files (before session to avoid unnecessary session creation)
app.use(express.static('public'))

// 3. Body parsing middleware (needed for form data)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 4. Session middleware (must come before flash and cookie-parser)
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

// 5. Cookie parser (after session)
app.use(cookieParser())

// 6. Flash middleware (after session)
app.use(flash())

// 7. Custom middleware for flash messages and global variables
app.use((req, res, next) => {
  // Make flash messages available to all templates
  res.locals.messages = req.flash()
  // Make session available to templates
  res.locals.session = req.session
  // Make user data available if logged in
  if (req.cookies.jwt) {
    try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET)
      res.locals.user = decoded
    } catch (error) {
      // Clear invalid token
      res.clearCookie('jwt')
    }
  }
  next()
})

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
 * JWT Token Checking Middleware
 * (After routes that don't need authentication)
 *************************/
app.use(utilities.checkJWTToken)

/* ***********************
 * Error Handling Middleware
 *************************/

// Catch-all 404 handler
app.use(async (req, res) => {
  const nav = await utilities.getNav()
  res.status(404).render("error", {
    title: "404 Not Found",
    nav,
    message: "The page you're looking for does not exist.",
  })
})

// Global error handler (must be last)
app.use(handleError)

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 5500
const host = process.env.HOST || 'localhost'

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})