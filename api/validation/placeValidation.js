const Joi = require("joi");

const placeValidation = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "any.required": "Name is required",
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must be at most 100 characters long",
  }),

  type: Joi.string().valid("guest_house", "restaurant").required().messages({
    "any.required": "Type is required",
    "any.only": "Type must be either 'guest_house' or 'restaurant'",
  }),

  address: Joi.string().min(5).max(200).required().messages({
    "any.required": "Address is required",
    "string.base": "Address must be a string",
    "string.min": "Address must be at least 5 characters long",
    "string.max": "Address must be at most 200 characters long",
  }),

  latitude: Joi.number().min(-90).max(90).required().messages({
    "any.required": "Latitude is required",
    "number.base": "Latitude must be a number",
    "number.min": "Latitude must be at least -90",
    "number.max": "Latitude must be at most 90",
  }),

  longitude: Joi.number().min(-180).max(180).required().messages({
    "any.required": "Longitude is required",
    "number.base": "Longitude must be a number",
    "number.min": "Longitude must be at least -180",
    "number.max": "Longitude must be at most 180",
  }),

  images: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Images must be an array of strings",
  }),

  governorate: Joi.string().valid("aswan", "luxor").required().messages({
    "any.required": "Governorate is required",
    "any.only": "Governorate must be either 'aswan' or 'luxor'",
  }),

  rating: Joi.number().min(0).max(5).default(0).messages({
    "number.base": "Rating must be a number",
    "number.min": "Rating cannot be less than 0",
    "number.max": "Rating cannot be more than 5",
  }),

  description: Joi.string().max(500).optional().messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 500 characters",
  }),

  rooms: Joi.when("type", {
    is: "guest_house",
    then: Joi.number().integer().min(1).required().messages({
      "any.required": "Rooms are required for guest houses",
      "number.base": "Rooms must be a number",
      "number.min": "Guest house must have at least 1 room",
    }),
    otherwise: Joi.forbidden(), // denied if type is restaurant
  }),

  cuisine: Joi.when("type", {
    is: "restaurant",
    then: Joi.array().items(Joi.string().min(2)).min(1).required().messages({
      "any.required": "Cuisine is required for restaurants",
      "array.base": "Cuisine must be an array of strings",
      "array.min": "At least one cuisine is required",
    }),
    otherwise: Joi.forbidden(), // denied if type is guest_house
  }),

  pricePerTable: Joi.when("type", {
    is: "restaurant",
    then: Joi.number().min(0).required().messages({
      "any.required": "Price per table is required for restaurants",
      "number.base": "Price per table must be a number",
      "number.min": "Price per table cannot be negative",
    }),
    otherwise: Joi.forbidden(),
  }),

  chairsPerTable: Joi.when("type", {
    is: "restaurant",
    then: Joi.number().integer().min(1).required().messages({
      "any.required": "Chairs per table is required for restaurants",
      "number.base": "Chairs per table must be a number",
      "number.min": "Chairs per table must be at least 1",
    }),
    otherwise: Joi.forbidden(),
  }),

  breakfast: Joi.when("type", {
    is: "guest_house",
    then: Joi.boolean().optional().messages({
      "boolean.base": "Breakfast must be a boolean",
    }),
    otherwise: Joi.forbidden(),
  }),

  wifi: Joi.when("type", {
    is: "guest_house",
    then: Joi.boolean().optional().messages({
      "boolean.base": "Wifi must be a boolean",
    }),
    otherwise: Joi.forbidden(),
  }),

  airConditioning: Joi.when("type", {
    is: "guest_house",
    then: Joi.boolean().optional().messages({
      "boolean.base": "Air conditioning must be a boolean",
    }),
    otherwise: Joi.forbidden(),
  }),

  pricePerNight: Joi.when("type", {
    is: "guest_house",
    then: Joi.number().min(0).required().messages({
      "any.required": "Price per night is required for guest houses",
      "number.base": "Price per night must be a number",
      "number.min": "Price per night cannot be negative",
    }),
    otherwise: Joi.forbidden(),
  }),

  createdAt: Joi.date().default(Date.now),
});

module.exports = placeValidation;