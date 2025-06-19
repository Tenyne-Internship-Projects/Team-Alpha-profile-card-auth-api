//@ Import Joi for data validation
const Joi = require("joi");

//@ Schema for validating profile update fields
const profileUpdateSchema = Joi.object({
  fullname: Joi.string().optional(),
  gender: Joi.string()
    .valid("male", "female", "non-binary", "other")
    .optional(),
  dateOfBirth: Joi.date().optional(),
  profession: Joi.string().optional(),
  specialization: Joi.string().optional(),
  location: Joi.string().optional(),
  bio: Joi.string().max(1500).optional(),
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
    .optional(),
  linkedIn: Joi.string().uri().optional().allow(""),
  github: Joi.string().uri().optional().allow(""),
  primaryEmail: Joi.string().email().optional(),
  phoneNumber: Joi.string().optional(),
  salaryExpectation: Joi.number().optional(),
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
