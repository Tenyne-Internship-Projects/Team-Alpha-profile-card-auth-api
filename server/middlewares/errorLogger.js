const Sentry = require("@sentry/node");

//@ Middleware to log and respond to errors in the app
const errorLogger = (err, req, res, next) => {
  // Send the error to Sentry for monitoring and tracking
  Sentry.captureException(err); // Useful for manual error capture

  // If in development mode, also log the error stack to the console
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }
  // Send a JSON response with the error message and status
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};

module.exports = {
  errorLogger,
};
