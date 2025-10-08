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

// Load environment variables FIRST
const env = require("dotenv").config()

// Critical environment variable check
if (!process.env.ACCESS_TOKEN_SECRET) {
  console.error('❌ CRITICAL ERROR: ACCESS_TOKEN_SECRET environment variable is not set')
  console.error('Please set ACCESS_TOKEN_SECRET in your Render.com environment variables')
  process.exit(1) // Stop the application if JWT secret is missing
}

const utilities = require("./utilities/")
const baseController = require("./controllers/baseController")
const static = require("./routes/static")
const inventoryRoute = require("./routes/inventoryRoute")
const errorRoute = require("./routes/errorRoute")
const db = require('./database/')
const handleError = require("./middleware/errorHandler")
const jwt = require("jsonwebtoken")
const app = express()

/* ***********************
 * Environment Verification
 *************************/
console.log('=== ENVIRONMENT VERIFICATION ===')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing')
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Missing')
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? `Set (length: ${process.env.ACCESS_TOKEN_SECRET.length})` : 'MISSING')
console.log('================================')

/* ***********************
 * Middleware Setup
 *************************/

// Trust proxy for Render.com
app.set('trust proxy', 1)

// 1. Compression
app.use(compression())

// 2. Static files
app.use(express.static('public'))

// 3. Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 4. Session middleware - Fixed for production
const PGStore = require('connect-pg-simple')(session)

app.use(session({
  store: new PGStore({
    pool: db.pool,
    createTableIfMissing: true,
    pruneSessionInterval: false,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
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
      res.locals.accountData = decoded;
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
 * Debug Routes (Add before main routes)
 *************************/
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'Server is running',
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'Set' : 'Missing',
    sessionSecret: process.env.SESSION_SECRET ? 'Set' : 'Missing',
    jwtSecret: process.env.ACCESS_TOKEN_SECRET ? 'Set' : 'Missing',
    jwtSecretLength: process.env.ACCESS_TOKEN_SECRET ? process.env.ACCESS_TOKEN_SECRET.length : 0,
    host: req.get('host'),
    secure: req.secure
  })
})

app.get('/api/debug-db', async (req, res) => {
  try {
    const result = await db.query('SELECT version(), current_database() as db_name')
    res.json({
      status: 'SUCCESS',
      database: result.rows[0],
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      environment: process.env.NODE_ENV
    })
  }
})

app.get('/api/check-jwt', (req, res) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    return res.status(500).json({
      status: 'ERROR',
      message: 'ACCESS_TOKEN_SECRET is not configured',
      help: 'Set ACCESS_TOKEN_SECRET in Render.com environment variables'
    })
  }
  
  res.json({
    status: 'SUCCESS',
    message: 'JWT is properly configured',
    environment: process.env.NODE_ENV
  })
})

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
  console.log(`JWT Secret Status: ${process.env.ACCESS_TOKEN_SECRET ? '✅ Configured' : '❌ Missing'}`)
  
  if (!process.env.ACCESS_TOKEN_SECRET) {
    console.log('❌ APPLICATION WILL NOT START: ACCESS_TOKEN_SECRET is required')
    process.exit(1)
  }
})