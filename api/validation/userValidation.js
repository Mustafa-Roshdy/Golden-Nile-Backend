const validator = require("joi");

const userValid = validator.object({
  userId: validator.number().integer().positive().required().messages({
    "any.required": "User ID is required",
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
    "number.positive": "User ID must be a positive number",
  }),

  firstName: validator.string().min(2).max(50).required().messages({
    "any.required": "First name is required",
    "string.base": "First name must be a string",
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name must be at most 50 characters long",
  }),

  lastName: validator.string().min(2).max(50).required().messages({
    "any.required": "Last name is required",
    "string.base": "Last name must be a string",
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name must be at most 50 characters long",
  }),

  gender: validator.string().valid("male", "female").required().messages({
    "any.required": "Gender is required",
    "any.only": "Gender must be either 'male' or 'female'",
  }),

  email: validator.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address",
  }),

  password: validator.string().min(6).required().messages({
    "any.required": "Password is required",
    "string.base": "Password must be a string",
    "string.min": "Password must be at least 6 characters long",
  }),

  phone: validator.string().pattern(/^[0-9]{10,15}$/).allow("", null).messages({
    "string.pattern.base": "Phone number must contain only digits (10–15 digits)",
  }),

  age: validator.number().integer().min(18).max(100).required().messages({
    "any.required": "Age is required",
    "number.base": "Age must be a number",
    "number.integer": "Age must be an integer",
    "number.min": "Age must be at least 18",
    "number.max": "Age must be less than or equal to 100",
  }),

  role: validator.string().valid("admin", "customer","supervisor").default("customer").messages({
    "any.only": "Role must be either 'admin' or 'customer'",
  }),

  createdAt: validator.date().default(() => new Date()).messages({
    "date.base": "CreatedAt must be a valid date",
  }),
});

const updateUserValid = validator.object({
  firstName: validator.string().min(2).max(50).messages({
    "string.base": "First name must be a string",
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name must be at most 50 characters long",
  }),

  lastName: validator.string().min(2).max(50).messages({
    "string.base": "Last name must be a string",
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name must be at most 50 characters long",
  }),

  gender: validator.string().valid("male", "female").messages({
    "any.only": "Gender must be either 'male' or 'female'",
  }),

  email: validator.string().email().messages({
    "string.email": "Email must be a valid email address",
  }),

  phone: validator.string().pattern(/^[0-9]{10,15}$/).allow("", null).messages({
    "string.pattern.base": "Phone number must contain only digits (10–15 digits)",
  }),

  age: validator.number().integer().min(18).max(100).messages({
    "number.base": "Age must be a number",
    "number.integer": "Age must be an integer",
    "number.min": "Age must be at least 18",
    "number.max": "Age must be less than or equal to 100",
  }),

  role: validator.string().valid("admin", "customer").messages({
    "any.only": "Role must be either 'admin' or 'customer'",
  }),
});

module.exports = userValid;
module.exports.updateUserValid = updateUserValid;













