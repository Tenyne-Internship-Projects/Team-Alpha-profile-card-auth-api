const validateRequest = (schema) => (req, res, next) => {
  //@ Validate the request body using the given schema
  //@ `abortEarly: false` ensures all errors are returned, not just the first one
  const { error } = schema.validate(req.body, { abortEarly: false });
  //@ If there are validation errors, send a 400 response with error messages
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      //@ Extract and return only the error messages
      errors: error.details.map((detail) => detail.message),
    });
  }
  //@ If no validation errors, continue to the next middleware or controller
  next();
};
//@ Export the validation middleware for use in routes
module.exports = validateRequest;
