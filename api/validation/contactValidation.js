const Joi = require("joi");

const createContactValidation = Joi.object({
  contactUserId: Joi.string().hex().length(24).required(),
});

const addMessageValidation = Joi.object({
  message: Joi.string().min(1).required(),
});

const updateMessageValidation = Joi.object({
  message: Joi.string().min(1).required(),
});

module.exports = {
  createContactValidation,
  addMessageValidation,
  updateMessageValidation,
};