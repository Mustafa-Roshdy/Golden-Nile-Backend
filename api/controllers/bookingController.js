const Booking = require("../models/bookingModel.js");
const Place = require("../models/placeModel.js");

// Create Booking
async function createBooking(data) {
  const count = await Booking.countDocuments();
  if (count >= 30) {
    throw new Error("Cannot create more than 30 bookings");
  }
  // Auto-assign admin = place.createdBy
  const place = await Place.findById(data.place);
  if (!place) throw new Error("Place not found");

  data.admin = place.createdBy;

  // Create booking
  const booking = await Booking.create(data);

  // Return populated booking
  return await Booking.findById(booking._id)
    .populate("place")
    .populate("user")
    .populate("admin");
}

// Get bookings by user
async function getBookingByUser(userID) {
  return await Booking.find({ user: userID })
    .populate("place")
    .populate("user")
    .populate("admin");
}

// Get bookings by place
async function getBookingByPlace(placeID) {
  return await Booking.find({ place: placeID })
    .populate("place")
    .populate("user")
    .populate("admin");
}

// Get bookings by admin (place owner)
async function getBookingByAdmin(adminID) {
  return await Booking.find({ admin: adminID })
    .populate("place")
    .populate("user")
    .populate("admin");
}

// Get single booking by ID
async function getBooking(id) {
  return await Booking.findById(id)
    .populate("place")
    .populate("user")
    .populate("admin");
}

// Update booking
async function updateBooking(id, newData) {
  return await Booking.findByIdAndUpdate(id, newData, { new: true })
    .populate("place")
    .populate("user")
    .populate("admin");
}

// Checkout booking (add rooms back for guest house)
async function checkoutBooking(id) {
  const booking = await Booking.findById(id).populate("place");
  if (!booking) throw new Error("Booking not found");

  if (booking.bookingType === "guest_house") {
    const place = booking.place;
    place.rooms += booking.numberOfRooms;
    if (!place.isAvailable) {
      place.isAvailable = true;
    }
    await place.save();
  }

  // Optionally, mark booking as checked out, but since no status field, just return
  return booking;
}

// Get all bookings
async function getAllBookings() {
  return await Booking.find()
    .populate("place")
    .populate("user")
    .populate("admin");
}

// Delete booking
async function deleteBooking(id) {
  return await Booking.findByIdAndDelete(id);
}

module.exports = {
  createBooking,
  getBookingByUser,
  getBookingByPlace,
  getBookingByAdmin,
  getBooking,
  getAllBookings,
  updateBooking,
  checkoutBooking,
  deleteBooking,
};
