const Joi = require("joi");

const bookingValid = Joi.object({
  bookingType: Joi.string().valid("guest_house", "restaurant").required(),

  // -----------------------------
  // Guest House fields
  // -----------------------------
  arrivalDate: Joi.when("bookingType", {
    is: "guest_house",
    then: Joi.date().required(),
    otherwise: Joi.forbidden(),
  }),

  leavingDate: Joi.when("bookingType", {
    is: "guest_house",
    then: Joi.date().greater(Joi.ref("arrivalDate")).required(),
    otherwise: Joi.forbidden(),
  }),

  numberOfRooms: Joi.when("bookingType", {
    is: "guest_house",
    then: Joi.number().integer().min(1).required(),
    otherwise: Joi.forbidden(),
  }),

  guestTypes: Joi.when("bookingType", {
    is: "guest_house",
    then: Joi.object({
      adults: Joi.number().integer().min(1).required(),
      children: Joi.number().integer().min(0).default(0),
    }).required(),
    otherwise: Joi.forbidden(),
  }),

  // -----------------------------
  // Restaurant fields
  // -----------------------------
  bookingDay: Joi.when("bookingType", {
    is: "restaurant",
    then: Joi.date().required(),
    otherwise: Joi.forbidden(),
  }),

  bookingTime: Joi.when("bookingType", {
    is: "restaurant",
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),

  // -----------------------------
  // Shared fields
  // -----------------------------

  governorate: Joi.string().valid("aswan", "luxor").required(),

  memberNumber: Joi.number().integer().min(1).required(),

  roomNumber: Joi.number().integer().min(1),

  totalPrice: Joi.number().min(0).required(),

  place: Joi.string().hex().length(24).required(),

  platform: Joi.string().valid("web", "mobile").default("web").optional(),
});

module.exports = bookingValid;
