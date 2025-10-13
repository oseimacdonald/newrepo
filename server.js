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
const accountRoute = require("./routes/accountRoute")
const errorRoute = require("./routes/errorRoute")
const cartRoute = require("./routes/cartRoute") 
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

// 7. JWT Token Middleware - Applied universally to all routes
app.use(utilities.checkJWTToken)

// 8. Global User Middleware - Make flash messages available to all templates
app.use(async (req, res, next) => {
  res.locals.messages = req.flash()
  res.locals.session = req.session
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
app.use("/account", accountRoute)

// Cart routes - ADD THIS SECTION
app.use("/cart", cartRoute)

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