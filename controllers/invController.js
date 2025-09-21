const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

/* *******************************************************
*  Controller function to fetch and render the vehicle detail view
*  ****************************************************** */
invCont.getVehicleDetail = async (req, res) => {
  const vehicleId = req.params.vehicleId;

  try {
    const vehicleData = await invModel.getVehicleById(vehicleId);

    if (vehicleData) {
      const nav = await utilities.getNav();

      res.render('inventory/vehicle-detail', {
        title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
        nav,
        vehicleData
      });
    } else {
      res.status(404).send('Vehicle not found');
    }
  } catch (error) {
    console.error("Error fetching vehicle details:", error); // <-- Add this for visibility
    res.status(500).send('Error fetching vehicle details');
  }
};


module.exports = invCont