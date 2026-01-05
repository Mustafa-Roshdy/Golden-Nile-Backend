const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware.js");
const { createFakePayment } = require("../controllers/paymentController.js");

// POST /api/payments/fake
router.post("/payments/fake", protect, async (req, res) => {
  try {
    const result = await createFakePayment(req.body, req.user.id);

    // Emit socket notification to the admin/owner if payment is successful
    const io = req.app.get("io");
    if (io && result.paymentStatus === "paid") {
      // We need to fetch the booking again to get the admin, or better, return it from controller
      // For now, let's assume we can get it from the populated booking in the future if needed
      // Actually, createFakePayment doesn't return the full booking.
      // But we can just use the bookingId and let the client handle it if they need to check.
      // Emitting to everyone in the booking room and the user room might be overkill
      // but let's at least try to notify the admin if we had their ID.
      // For now, let's just send the message to the booking room if it exists.
      io.to(req.body.bookingId).emit("notificationReceived", {
        type: "payment",
        message: `Payment confirmed for booking ${req.body.bookingId}`,
        bookingId: req.body.bookingId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: result,
    });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: err.message || "Payment failed" });
  }
});

module.exports = router;

