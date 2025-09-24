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
const errorRoute = require("./routes/errorRoute");


/* ********************************************
** Middleware
** ****************************************** */
app.use(session({
  store: new(require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))


/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") /* not at views root */

/* ***********************
 * Routes
 *************************/
app.use(static)
app.use(express.static('public'));
app.use("/error", errorRoute);


// Index route
app.get("/", baseController.buildHome)

// Inventory routes
app.use("/inv", inventoryRoute)

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT
const host = process.env.HOST

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})

/*  Add this import */
const handleError = require("./middleware/errorHandler");
const session = require("express-session")


/* Catch-all 404 (optional) */
app.use((req, res) => {
  const nav = ""; /* Optional: replace with await getNav() if needed */
  res.status(404).render("error", {
    title: "404 Not Found",
    nav,
    message: "The page you’re looking for does not exist.",
  });
});

/* Must be LAST middleware */
app.use(handleError);
