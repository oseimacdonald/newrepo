const express = require("express");
const router = new express.Router();
const invCont = require("../controllers/invController")
console.log("invCont.buildCheckoutView:", invCont.buildCheckoutView)
const utilities = require("../utilities");
const authMiddleware = require('../middleware/authMiddleware');

// ==================== CART ROUTES ====================


console.log("invCont:", invCont);
console.log("invCont.buildCartView:", invCont?.buildCartView);
console.log("utilities.handleErrors:", utilities?.handleErrors);
// Route to show shopping cart (requires login)
router.get("/", 
  authMiddleware.checkLogin, 
  utilities.handleErrors(invCont.buildCartView)
);

// Route to add item to cart (AJAX - requires login)
router.post("/add", 
  authMiddleware.checkLogin, 
  utilities.handleErrors(invCont.addToCart)
);

// Route to remove item from cart (requires login)
router.post("/remove/:cart_item_id", 
  authMiddleware.checkLogin, 
  utilities.handleErrors(invCont.removeFromCart)
);

// Route to update cart quantity (AJAX - requires login)
router.post("/update-quantity", 
  authMiddleware.checkLogin, 
  utilities.handleErrors(invCont.updateCartQuantity)
);

// Route to show checkout page (requires login)
router.get("/checkout", 
  authMiddleware.checkLogin, 
  utilities.handleErrors(invCont.buildCheckoutView)
);

module.exports = router;