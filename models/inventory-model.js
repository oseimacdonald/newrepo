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


module.exports = {getClassifications, getInventoryByClassificationId, getVehicleById};