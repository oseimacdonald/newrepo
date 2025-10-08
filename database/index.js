const { Pool } = require("pg")
require("dotenv").config()

/* ***************
 * Connection Pool with proper configuration
 * to prevent ECONNRESET errors
 * *************** */

let pool

if (process.env.NODE_ENV == "development") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connection pool settings to prevent ECONNRESET
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client can remain idle before being closed
    connectionTimeoutMillis: 10000, // How long to wait for a connection
    maxUses: 7500, // Close a client after it has been used this many times
    ssl: {
      rejectUnauthorized: false,
    },
  })
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Production settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
}

// Handle connection errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  // Don't exit process in development, just log
  if (process.env.NODE_ENV === 'production') {
    process.exit(-1)
  }
})

// Test the connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected successfully')
})

// Enhanced query function with better error handling
const query = async (text, params) => {
  try {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("✅ executed query", { text, duration: `${duration}ms` })
    return res
  } catch (error) {
    console.error("❌ error in query", { text })
    console.error("Query error details:", error.message)
    throw error
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Shutting down gracefully...')
  await pool.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Shutting down gracefully...')
  await pool.end()
  process.exit(0)
})

module.exports = {
  query,
  pool
}