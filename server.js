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

// 4. Session middleware with better configuration
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool: require('./database/').pool,
    // Add these settings for connect-pg-simple
    pruneSessionInterval: process.env.NODE_ENV === 'production' ? 60 : false, // 60 seconds or disable in dev
    ttl: 24 * 60 * 60, // 24 hours in seconds
    errorLog: (message) => console.log('Session store:', message)
  }),
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_in_production',
  resave: false,
  saveUninitialized: false, // Changed to false for security
  rolling: true, // Reset maxAge on every request
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax'
  }
}))

// Database connection health check middleware
app.use(async (req, res, next) => {
  // Skip health check for static assets and health endpoint
  if (req.path.includes('.') || req.path === '/health') {
    return next()
  }
  
  try {
    // Simple query to check database connection
    await pool.query('SELECT 1 as connection_test')
    res.locals.dbHealthy = true
    next()
  } catch (error) {
    console.error('❌ Database connection health check failed:', error.message)
    
    // Don't block the request, but log the issue
    res.locals.dbHealthy = false
    next()
  }
})

// Add a health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1 as health_check')
    res.status(200).json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

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