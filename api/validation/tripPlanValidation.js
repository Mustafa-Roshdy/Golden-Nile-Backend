const validator = require("joi");

const tripPlanValid = validator.object({
  destination: validator.string().min(2).max(100).required().messages({
    "any.required": "Destination is required",
    "string.base": "Destination must be a string",
    "string.min": "Destination must be at least 2 characters long",
    "string.max": "Destination must be at most 100 characters long",
  }),

  budget: validator.number().min(0).optional().messages({
    "number.base": "Budget must be a number",
    "number.min": "Budget cannot be negative",
  }),

  duration: validator.number().integer().min(1).optional().messages({
    "number.base": "Duration must be a number",
    "number.integer": "Duration must be an integer",
    "number.min": "Duration must be at least 1 day",
  }),

  interesting: validator.string().optional().messages({
    "string.base": "Interesting must be a string",
  }),

  date: validator.date().optional().messages({
    "date.base": "Date must be a valid date",
  }),

  user: validator.string().hex().length(24).required().messages({
    "any.required": "User ID is required",
    "string.hex": "User must be a valid ObjectId",
    "string.length": "User must be a valid 24-character ObjectId",
  }),
});

module.exports = tripPlanValid;
