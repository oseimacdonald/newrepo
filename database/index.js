const { Pool } = require("pg")
require("dotenv").config()

/* ***************
 * Connection Pool - Fixed for both environments
 * *************** */

console.log('🔧 Environment:', process.env.NODE_ENV)

const isProduction = process.env.NODE_ENV === 'production'
const isRenderDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // SSL configuration for Render.com
  ssl: (isProduction || isRenderDB) ? { rejectUnauthorized: false } : false,
  // Connection settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}

const pool = new Pool(poolConfig)

// Query function for both environments
const query = async (text, params) => {
  try {
    const res = await pool.query(text, params)
    console.log("executed query", { text: text.substring(0, 50) + '...' })
    return res
  } catch (error) {
    console.error("error in query", { text: text.substring(0, 50) + '...', error: error.message })
    throw error
  }
}

// Export the same structure for both environments
module.exports = {
  query,
  pool
}