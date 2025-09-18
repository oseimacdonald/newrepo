const invModel = require("../models/inventory-model")
const Util = {}

/* *****************************
 * Constructs the nav HTML unordered list
 ******************************* */
Util.getNav = async function (req, res, next) {
    let data = await invModel.getClassifications()
    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'
    data.rows.forEach((row) => {
        list += "<ul>"
        list +=
            '<a href="/inv/type/' +
            row.classification_id +
            '" title="See our inventory of ' +
            row.classification_name +
            ' vehicle">' +
            row.classification_name +
            "</a>"
        })
        list += "</ul>"
        return list

}


/* ******************************************************
*  Build the classification view html
* ****************************************************** */
Util.buildClassificationGrid = async function(data){
    let grid
    if(data.length > 0){
        grid = 'ul id="inv-display">'
        data.forEach(vehicle => {
            grid += 'li'
            grid += '<a href="../../inv/detail/'+ vehicle.inv_id
            +'" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model
            + 'details"><img src="' + vehicle.inv_thumbnail
            +'" alt="image of '+ vehicle.inv_make + ' ' + vehicle.inv_model
            +' on CSE Motors" /></a>'
            grid += '<div class="namePrice">'
            grid += '<hr />'
            grid += '<h2>'
            grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View '
            + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">'
            + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
            grid += '</div>'
            grid += '</li>'
        })
        grid += '</ul>'
    } else {
        grid += '<p class="notice">sorry, no matching vehicles could be found.</p>'
    }
    return grid
}


module.exports = Util