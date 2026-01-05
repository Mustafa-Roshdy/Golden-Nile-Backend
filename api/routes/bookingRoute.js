const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController.js");
const bookingValidation = require("../validation/bookingValidation.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const Place = require("../models/placeModel.js");
const User = require("../models/userModel.js");
const {
  sendBookingConfirmationToUser,
  sendBookingNotificationToAdmin,
} = require("../services/emailService.js");

// ==========================
// CREATE BOOKING
// ==========================
router.post("/booking/create", protect, async (req, res) => {
  const { error } = bookingValidation.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const place = await Place.findById(req.body.place).populate("createdBy");
    if (!place)
      return res.status(404).json({ success: false, message: "Place not found" });

    if (!place.isAvailable)
      return res.status(400).json({
        success: false,
        message: "This place is not available",
      });

    // Determine booking type from place (guest_house or restaurant)
    const bookingType = place.type;

    // -------------------------
    // Validate booking type fields
    // -------------------------
    if (bookingType === "guest_house") {
      // Required fields
      if (!req.body.arrivalDate || !req.body.leavingDate)
        return res.status(400).json({
          success: false,
          message: "Guest house booking requires arrival and leaving dates",
        });

      if (!req.body.numberOfRooms)
        return res.status(400).json({
          success: false,
          message: "numberOfRooms is required for guest house",
        });

      // -------------------------
      // Check room availability
      // -------------------------
      if (place.rooms < req.body.numberOfRooms) {
        return res.status(400).json({
          success: false,
          message: `Only ${place.rooms} rooms available`,
        });
      }
    }

    if (bookingType === "restaurant") {
      if (!req.body.bookingDay || !req.body.bookingTime)
        return res.status(400).json({
          success: false,
          message: "Restaurant booking requires booking day and time",
        });
    }

    const customer = await User.findById(req.user.id);
    if (!customer)
      return res.status(404).json({ success: false, message: "User not found" });

    // -------------------------
    // Prepare booking data
    // -------------------------
    const bookingData = {
      ...req.body,
      user: req.user.id,
      admin: place.createdBy,
      bookingType,
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: null,
      platform:
        req.body.platform ||
        req.headers["x-platform"] ||
        (req.get("User-Agent")?.toLowerCase().includes("mobile") ? "mobile" : "web"),
    };

    // -------------------------
    // Create booking
    // -------------------------
    const booking = await bookingController.createBooking(bookingData);

    // -------------------------
    // Reduce rooms if guest house
    // -------------------------
    if (bookingType === "guest_house") {
      place.rooms -= booking.numberOfRooms;
      if (place.rooms === 0) {
        place.isAvailable = false;
      }
      await place.save();
    }

    // Emit socket notification to the admin/owner
    const io = req.app.get("io");
    if (io && place.createdBy) {
      const ownerId = place.createdBy._id || place.createdBy;
      console.log(`🔔 Emitting notificationReceived to Owner: ${ownerId}`);
      io.to(ownerId.toString()).emit("notificationReceived", {
        type: "booking",
        message: `New booking for ${place.name} from ${customer.firstName} ${customer.lastName}`,
        bookingId: booking._id,
        timestamp: new Date().toISOString()
      });
    }

    // Send response immediately
    res.status(201).json({ success: true, data: booking });

    // -------------------------
    // Send Emails Asynchronously (Fire and Forget)
    // -------------------------
    setImmediate(async () => {
      // Send customer confirmation email
      await sendBookingConfirmationToUser(
        customer.email,
        customer.firstName,
        booking
      );
      console.log(customer);

      // Send admin notification email
      const admin = place.createdBy;
      await sendBookingNotificationToAdmin(
        admin.email,
        admin.firstName,
        booking,
        customer
      );
      console.log(admin);
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================
// GET ROUTES
// ==========================
router.get("/booking/user/:userId", protect, async (req, res) => {
  try {
    const bookings = await bookingController.getBookingByUser(req.params.userId);
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/booking/place/:placeId", async (req, res) => {
  try {
    const bookings = await bookingController.getBookingByPlace(req.params.placeId);
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/booking/admin/:adminId", protect, async (req, res) => {
  try {
    const bookings = await bookingController.getBookingByAdmin(req.params.adminId);
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/booking/:id", async (req, res) => {
  try {
    const booking = await bookingController.getBooking(req.params.id);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/booking/all", protect, authorizeRoles("supervisor"), async (req, res) => {
  try {
    const bookings = await bookingController.getAllBookings();
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================
// UPDATE BOOKING
// ==========================
router.put("/booking/:id", protect, async (req, res) => {
  try {
    const booking = await bookingController.updateBooking(
      req.params.id,
      req.body
    );

    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================
// CHECKOUT BOOKING
// ==========================
router.post("/booking/:id/checkout", protect, async (req, res) => {
  try {
    const booking = await bookingController.getBooking(req.params.id);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    // Allow user or admin to checkout
    if (req.user.id !== booking.user.toString() && req.user.id !== booking.admin.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to checkout this booking" });
    }

    const checkedOutBooking = await bookingController.checkoutBooking(req.params.id);

    res.status(200).json({
      success: true,
      message: "Checkout successful",
      data: checkedOutBooking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================
// DELETE BOOKING
// ==========================
router.delete(
  "/booking/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const booking = await bookingController.getBooking(req.params.id);
      if (!booking)
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });

      const place = await Place.findById(booking.place);

      // Restore rooms if guest house booking
      if (booking.bookingType === "guest_house") {
        place.rooms += booking.numberOfRooms;
        if (!place.isAvailable) {
          place.isAvailable = true;
        }
        await place.save();
      }

      await bookingController.deleteBooking(req.params.id);

      res.status(200).json({
        success: true,
        message: "Booking deleted successfully",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
