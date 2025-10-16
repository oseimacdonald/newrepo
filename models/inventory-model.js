const pool = require("../database/")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications(){
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getclassificationsbyid error " + error)
  }
}

/* *********************************************
* *Function to get a vehicle by ID
* ******************************************** */
async function getVehicleById(vehicleId) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory WHERE inv_id = $1`,  /* Query to fetch specific vehicle data */
      [vehicleId]
    );
    return data.rows[0];  /* Return the vehicle data (first row) */
  } catch (error) {
    console.error("Error fetching vehicle by ID: " + error);
    throw error;  /* Ensure error propagation for handling in the controller */
  }
}

/* ***************************
 *  Add new classification
 * ************************** */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1)";
    const data = await pool.query(sql, [classification_name]);
    return data.rowCount;
  } catch (error) {
    console.error("Error inserting classification:", error);
    throw error;
  }
}

/* ***************************
 *  Add new inventory item
 * ************************** */
async function addInventoryItem(data) {
  const sql = `
    INSERT INTO inventory (
      classification_id, inv_make, inv_model, inv_year,
      inv_description, inv_image, inv_thumbnail,
      inv_price, inv_miles, inv_color
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`;

  const values = [
    data.classification_id,
    data.inv_make,
    data.inv_model,
    data.inv_year,
    data.inv_description,
    data.inv_image,
    data.inv_thumbnail,
    data.inv_price,
    data.inv_miles,
    data.inv_color
  ];

  try {
    const result = await pool.query(sql, values);
    return result.rows[0];
  } catch (error) {
    console.error("Model insert error:", error);
    throw error;
  }
}

/* ***************************
 *  Update Inventory Data
 * ************************** */
async function updateInventory(
  inv_id,
  inv_make,
  inv_model,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_year,
  inv_miles,
  inv_color,
  classification_id
) {
  try {
    const sql =
      "UPDATE public.inventory SET inv_make = $1, inv_model = $2, inv_description = $3, inv_image = $4, inv_thumbnail = $5, inv_price = $6, inv_year = $7, inv_miles = $8, inv_color = $9, classification_id = $10 WHERE inv_id = $11 RETURNING *"
    const data = await pool.query(sql, [
      inv_make,
      inv_model,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_year,
      inv_miles,
      inv_color,
      classification_id,
      inv_id
    ])
    return data.rows[0]
  } catch (error) {
    console.error("model error: " + error)
  }
}

/* ***************************
 *  Get ALL inventory items (not filtered by classification)
 * ************************** */
async function getAllInventory() {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory 
       ORDER BY inv_make, inv_model`
    );
    return data.rows;
  } catch (error) {
    console.error("getAllInventory error: " + error);
    return [];
  }
}

/* ****************************************
*  Get upgrades available for a specific vehicle
* *************************************** */
async function getUpgradesByVehicleId(vehicleId) {
  try {
    const sql = `
      SELECT u.* 
      FROM upgrades u
      JOIN vehicle_upgrades vu ON u.upgrade_id = vu.upgrade_id
      WHERE vu.inv_id = $1 AND u.upgrade_available = true
      ORDER BY u.upgrade_price
    `;
    const result = await pool.query(sql, [vehicleId]);
    return result.rows;
  } catch (error) {
    console.error("Error getting upgrades by vehicle ID:", error);
    return [];
  }
}

/* ****************************************
*  Add upgrade to user's cart
* *************************************** */
async function addUpgradeToCart(accountId, vehicleId, upgradeId, quantity) {
  try {
    const sql = `
      INSERT INTO cart (account_id, inv_id, upgrade_id, quantity, added_date)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (account_id, inv_id, upgrade_id)
      DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
      RETURNING *
    `;
    console.log('🔍 Executing upgrade cart SQL:', sql);
    console.log('🔍 With parameters:', [accountId, vehicleId, upgradeId, quantity]);
    
    const result = await pool.query(sql, [accountId, vehicleId, upgradeId, quantity]);
    console.log('✅ Upgrade cart result:', result.rows[0]);
    return result;
  } catch (error) {
    console.error("💥 Database error in addUpgradeToCart:", error);
    console.error("💥 Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    throw error;
  }
}
/* ****************************************
*  Add vehicle (no upgrade) to user's cart
* *************************************** */
async function addVehicleToCart(accountId, vehicleId, quantity) {
  try {
    const sql = `
      INSERT INTO cart (account_id, inv_id, upgrade_id, quantity, added_date)
      VALUES ($1, $2, NULL, $3, NOW())
      ON CONFLICT (account_id, inv_id, upgrade_id) 
      DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
      RETURNING *
    `;
    const result = await pool.query(sql, [accountId, vehicleId, quantity]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding vehicle to cart:", error);
    return null;
  }
}

/* ****************************************
*  Add item to cart (decides if upgrade or vehicle)
* *************************************** */
async function addToCart(accountId, vehicleId, quantity, upgradeId = null) {
  if (upgradeId === null) {
    return await addVehicleToCart(accountId, vehicleId, quantity);
  } else {
    return await addUpgradeToCart(accountId, vehicleId, upgradeId, quantity);
  }
}

/* ****************************************
*  Get cart items for a user
* *************************************** */
async function getCartItems(accountId) {
  try {
    const sql = `
      SELECT 
        c.cart_item_id,
        c.quantity,
        c.upgrade_id,
        u.upgrade_name,
        u.upgrade_description,
        u.upgrade_price,
        u.upgrade_image,
        i.inv_make,
        i.inv_model,
        i.inv_year,
        i.inv_description AS vehicle_description,
        i.inv_price AS vehicle_price,
        i.inv_image AS vehicle_image,
        CASE
          WHEN u.upgrade_id IS NOT NULL THEN u.upgrade_price * c.quantity
          ELSE i.inv_price * c.quantity
        END AS item_total
      FROM cart c
      LEFT JOIN upgrades u ON c.upgrade_id = u.upgrade_id
      JOIN inventory i ON c.inv_id = i.inv_id
      WHERE c.account_id = $1
      ORDER BY c.added_date DESC
    `;
    const result = await pool.query(sql, [accountId]);
    return result.rows;
  } catch (error) {
    console.error("Error getting cart items:", error);
    return [];
  }
}

/* ****************************************
*  Get cart count for badge indicator
* *************************************** */
async function getCartCount(accountId) {
  try {
    const sql = `
      SELECT COUNT(*) as item_count, COALESCE(SUM(quantity), 0) as total_quantity
      FROM cart 
      WHERE account_id = $1
    `;
    const result = await pool.query(sql, [accountId]);
    return result.rows[0].total_quantity;
  } catch (error) {
    console.error("Error getting cart count:", error);
    return 0;
  }
}

/* ****************************************
*  Calculate cart total price
* *************************************** */
async function calculateCartTotal(accountId) {
  try {
    const sql = `
      SELECT COALESCE(SUM(
        CASE
          WHEN u.upgrade_id IS NOT NULL THEN u.upgrade_price * c.quantity
          ELSE i.inv_price * c.quantity
        END
      ), 0) AS total
      FROM cart c
      LEFT JOIN upgrades u ON c.upgrade_id = u.upgrade_id
      JOIN inventory i ON c.inv_id = i.inv_id
      WHERE c.account_id = $1
    `;
    const result = await pool.query(sql, [accountId]);
    return parseFloat(result.rows[0].total);
  } catch (error) {
    console.error("Error calculating cart total:", error);
    return 0;
  }
}


/* ****************************************
*  Remove item from cart
* *************************************** */
async function removeFromCart(cartItemId, accountId) {
  try {
    const sql = `
      DELETE FROM cart 
      WHERE cart_item_id = $1 AND account_id = $2
      RETURNING *
    `;
    const result = await pool.query(sql, [cartItemId, accountId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error removing from cart:", error);
    return false;
  }
}

/* ****************************************
*  Update cart item quantity
* *************************************** */
async function updateCartQuantity(cartItemId, quantity, accountId) {
  try {
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      return await removeFromCart(cartItemId, accountId);
    }
    
    const sql = `
      UPDATE cart 
      SET quantity = $1 
      WHERE cart_item_id = $2 AND account_id = $3
      RETURNING *
    `;
    const result = await pool.query(sql, [quantity, cartItemId, accountId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return false;
  }
}

/* ****************************************
*  Get all available upgrades (for admin management)
* *************************************** */
async function getAllUpgrades() {
  try {
    const sql = `
      SELECT * FROM upgrades 
      WHERE upgrade_available = true 
      ORDER BY upgrade_name
    `;
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("Error getting all upgrades:", error);
    return [];
  }
}

module.exports = {
  getClassifications, 
  getInventoryByClassificationId, 
  getVehicleById, 
  addClassification,
  addInventoryItem,
  updateInventory,
  getAllInventory,
  getUpgradesByVehicleId,
  addUpgradeToCart,
  addToCart,   // <== Exporting addToCart here
  getCartItems,
  getCartCount,
  calculateCartTotal,
  removeFromCart,
  updateCartQuantity,
  getAllUpgrades
};
