const Joi = require("joi");

const programValid = Joi.object({
  tripPlan: Joi.string().hex().length(24).required().messages({
    "any.required": "TripPlan ID is required",
    "string.hex": "TripPlan must be a valid ObjectId",
    "string.length": "TripPlan must be a valid 24-character ObjectId",
  }),

  details: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string().min(1).messages({
          "string.base": "Detail must be a string",
          "string.empty": "Detail string cannot be empty",
        }),
        Joi.object().unknown(true).messages({
          "object.base": "Detail must be a valid object",
        })
      )
    )
    .min(1)
    .required()
    .messages({
      "any.required": "Details are required",
      "array.base": "Details must be an array",
      "array.min": "Details array must contain at least 1 item",
    }),
});

module.exports = programValid;
