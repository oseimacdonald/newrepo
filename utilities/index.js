const invModel = require("../models/inventory-model")
const Util = {}


/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
  let data = await invModel.getClassifications()
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list += `<a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">${row.classification_name}</a>`
    list += "</li>"
  })
  list += "</ul>"
  return list
}


/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function(data){
  let grid = ''
  if(data.length > 0){
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => { 
      grid += '<li>'
      grid +=  `<a href="../../inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details"><img src="${vehicle.inv_thumbnail}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model} on CSE Motors" /></a>`
      grid += '<div class="namePrice">'
      grid += '<hr />'
      grid += '<h2>'
      grid += `<a href="../../inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">${vehicle.inv_make} ${vehicle.inv_model}</a>`
      grid += '</h2>'
      grid += `<span>$${new Intl.NumberFormat('en-US').format(vehicle.inv_price)}</span>`
      grid += '</div>'
      grid += '</li>'
    })
    grid += '</ul>'
  } else { 
    grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}

/* ************************************************************
*  * Function to generate html content for a specific vehicle
*  ********************************************************** */
Util.generateVehicleHtml = (vehicleData) => {
  const price = vehicleData.inv_price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const mileage = vehicleData.inv_mileage.toLocaleString('en-US');
  
  return `
    <div class="vehicle-detail">
      <h1>${vehicleData.inv_make} ${vehicleData.inv_model}</h1>
      <img src="${vehicleData.inv_image_url}" alt="${vehicleData.inv_make} ${vehicleData.inv_model}" class="vehicle-image"/>
      <div class="vehicle-info">
        <h2>${vehicleData.inv_year} ${vehicleData.inv_make} ${vehicleData.inv_model}</h2>
        <p><strong>Price:</strong> ${price}</p>
        <p><strong>Mileage:</strong> ${mileage} miles</p>
        <p><strong>Year:</strong> ${vehicleData.inv_year}</p>
        <p><strong>Engine:</strong> ${vehicleData.inv_engine}</p>
        <p><strong>Transmission:</strong> ${vehicleData.inv_transmission}</p>
        <p><strong>Color:</strong> ${vehicleData.inv_color}</p>
        <p><strong>VIN:</strong> ${vehicleData.inv_vin}</p>
        <p>${vehicleData.inv_description}</p>
      </div>
    </div>
  `;
};

/* ******************************
 * Error-handling wrapper
 ****************************** */
Util.handleErrors = function(controllerFunction) {
  return async function(req, res, next) {
    try {
      await controllerFunction(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = Util
