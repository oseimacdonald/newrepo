function handleError(err, req, res, next) {
  console.error("ERROR:", err.message);
  console.error(err.stack);

 /* fallback if nav isn't ready */
  const nav = req.app.locals.nav || ""; 

  res.status(500).render("error", {
    title: "Server Error",
    nav,
    message: err.message || "Something went wrong on the server.",
  });
}

module.exports = handleError;
