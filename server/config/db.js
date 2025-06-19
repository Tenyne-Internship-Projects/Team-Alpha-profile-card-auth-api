//@ Load environment variables from .env file
require("dotenv").config();

const { Pool } = require("pg");

//@ Warn if POSTGRES_URI is not defined (needed to connect to the database)
if (!process.env.POSTGRES_URI) {
  console.warn(
    "[DB] Warning: POSTGRES_URI is not defined in environment variables. Database connection may fail."
  );
}

//@ Check if the app is running in production mode
const isProduction = process.env.NODE_ENV === "production";
console.log(`[DB] SSL enabled: ${isProduction}`);

//@ Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

//@ Function to test and establish the database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connected successfully");
    client.release(); //@ Always release the client after connecting
  } catch (error) {
    console.error("PostgreSQL connection failed:", error.message);
  }
};

//@ Helper function to run queries using the pool
const query = (text, params) => pool.query(text, params);

//@ Export the connection, pool, and query utility
module.exports = {
  connectDB,
  pool,
  query,
};
