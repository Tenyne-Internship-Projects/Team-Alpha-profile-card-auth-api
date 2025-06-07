const Joi = require("joi");

const profileUpdateSchema = Joi.object({
  fullname: Joi.string().required().messages({
    "any.required": "Full name is required",
  }),
  gender: Joi.string()
    .valid("male", "female", "non-binary", "other")
    .required(),
  age: Joi.number().integer().min(0),
  dateOfBirth: Joi.date(),
  profession: Joi.string().required(),
  specialization: Joi.string(),
  location: Joi.string().required(),
  bio: Joi.string().max(1500),
  skills: Joi.string()
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
        return value;
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
  linkedIn: Joi.string().uri().optional().allow(""),
  github: Joi.string().uri().optional().allow(""),
  primaryEmail: Joi.string().email().required(),
  phoneNumber: Joi.string().required(),
  salaryExpectation: Joi.number(),
  password: Joi.string().min(6).optional(),
});

module.exports = { profileUpdateSchema };
