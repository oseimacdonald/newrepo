/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const env = require("dotenv").config()
const app = express()
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute") 
const session = require("express-session")
const pool = require('./database/')
const compression = require('compression');
const errorRoute = require("./routes/errorRoute");
const flash = require('connect-flash');

/* ***********************
 * Middleware Setup
 *************************/
// Compression should be early
app.use(compression());

// Session middleware
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))

// Flash messages middleware (AFTER session)
app.use(flash());

// Express messages middleware
app.use(function(req, res, next){
  res.locals.messages = req.flash(); // This will give you access to flash messages
  next();
})

// Body parser middleware (important for form data)
app.use(express.json());
/* ***************************************************************************************
**This is the equivalent of body-parser(performs the same function as using the 
**separate body-parser middleware, which used to be a common practice before Express 4.16.0.)
* **************************************************************************************** */
app.use(express.urlencoded({ extended: true })); 

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") /* not at views root */

/* ***********************
 * Routes
 *************************/
// Static routes should come first
app.use(express.static('public'));
app.use(static)

// Index route
app.get("/", baseController.buildHome)

// Inventory routes
app.use("/inv", inventoryRoute)

// Account routes
app.use("/account", require("./routes/accountRoute"))

// Error routes
app.use("/error", errorRoute);

/* ***********************
 * Error Handling Middleware
 *************************/
const handleError = require("./middleware/errorHandler");

// Catch-all 404
app.use((req, res) => {
  const nav = ""; /* Optional: replace with await getNav() if needed */
  res.status(404).render("error", {
    title: "404 Not Found",
    nav,
    message: "The page you're looking for does not exist.",
  });
});

// Global error handler (must be last)
app.use(handleError);

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
})