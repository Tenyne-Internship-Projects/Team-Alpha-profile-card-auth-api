//@ Import Joi for data validation
const Joi = require("joi");

//@ Schema for validating profile update fields
const profileUpdateSchema = Joi.object({
  fullname: Joi.string().required().messages({
    "any.required": "Full name is required",
  }),

  //@ Gender must be one of the allowed options
  gender: Joi.string()
    .valid("male", "female", "non-binary", "other")
    .required(),

  //@ Age must be a positive whole number (optional)
  age: Joi.number().integer().min(0),

  //@ Date of birth (optional)
  dateOfBirth: Joi.date(),

  //@ Profession is required
  profession: Joi.string().required(),

  //@ Specialization is required
  specialization: Joi.string().required(),

  //@ Location is required
  location: Joi.string().required(),

  //@ Short bio (optional, max 1500 characters) required
  bio: Joi.string().max(1500).required(),

  //@ Skills must be a stringified array (e.g., '["React", "Node.js"]')
  skills: Joi.string()
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
        return parsed;
      } catch {
        return helpers.error("any.invalid");
      }
    })
    .required()
    .messages({
      "any.required": "Skills are required",
      "any.invalid":
        'Skills must be a JSON array string (e.g. ["React", "Node.js"])',
    }),

  //@ Optional links
  linkedIn: Joi.string().uri().optional().allow(""),
  github: Joi.string().uri().optional().allow(""),

  //@ Optional primary email
  primaryEmail: Joi.string().email().optional(),

  //@ Phone number is required
  phoneNumber: Joi.string().required(),

  //@ Optional salary expectation
  salaryExpectation: Joi.number(),

  //@ Optional password (at least 8 characters if provided)
  password: Joi.string().min(8).optional(),

  //@ Availability status (optional)
  isAvailable: Joi.boolean().optional(),

  //@ Optional avatar string (base64 or path)
  avatar: Joi.string().optional(),

  //@ Optional documents array (file names or base64 strings)
  documents: Joi.array().items(Joi.string()).optional(),
});

//@ Schema for toggling user's availability (true/false)
const availabilityToggleSchema = Joi.object({
  isAvailable: Joi.boolean().required(), // Only accepts true or false
});
//@ Export the schemas to use in route validation
module.exports = {
  profileUpdateSchema,
  availabilityToggleSchema,
};
