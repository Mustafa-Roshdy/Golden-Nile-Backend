const Booking = require("../models/bookingModel.js");
const Payment = require("../models/paymentModel.js");
const { sendPaymentConfirmationEmail } = require("../services/emailService.js");

// Generate a simple fake transaction id
const buildFakeTransactionId = () =>
  `FAKE-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

/**
 * Create a fake payment and mark booking as paid.
 * This simulates a gateway success response.
 */
async function createFakePayment(payload, userId) {
  const { bookingId, method, amount, platform = "web", simulateStatus } = payload;

  if (!bookingId) {
    throw new Error("bookingId is required");
  }
  if (!["visa", "wallet"].includes(method)) {
    throw new Error("Invalid payment method");
  }

  const booking = await Booking.findById(bookingId)
    .populate("place")
    .populate("user")
    .populate("admin");
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Basic authorization: only booking owner or admin can pay
  if (
    userId &&
    booking.user?._id?.toString() !== userId.toString() &&
    booking.admin?._id?.toString() !== userId.toString()
  ) {
    // Allow if testing/demo? No, keep security.
    // Check if booking.user is populated object or id
    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    const bookingAdminId = booking.admin._id ? booking.admin._id.toString() : booking.admin.toString();

    if (bookingUserId !== userId.toString() && bookingAdminId !== userId.toString()) {
      throw new Error("Not authorized to pay for this booking");
    }
  }

  // Determine status based on simulation or default to paid
  const targetPaymentStatus = simulateStatus || "paid"; // "paid", "pending", "failed"

  let targetBookingStatus = "confirmed";
  if (targetPaymentStatus === "pending") {
    targetBookingStatus = "awaiting_payment";
  } else if (targetPaymentStatus === "failed") {
    targetBookingStatus = "canceled";
    // Wait, if payment failed, do we cancel the booking immediately? 
    // The requirements say: Failed -> canceled. "Scenario: Failed, Booking Status: canceled"
    // So yes.
  }

  const payment = await Payment.create({
    bookingId,
    userId: userId || booking.user?._id || booking.user,
    method,
    amount: amount ?? booking.totalPrice ?? 0,
    fakeTransactionId: buildFakeTransactionId(),
    platform,
    paymentStatus: targetPaymentStatus
  });

  // Update booking
  booking.status = targetBookingStatus;
  booking.paymentStatus = targetPaymentStatus;
  booking.paymentMethod = method;
  booking.platform = platform;
  await booking.save();

  // Fire-and-forget email only if paid
  if (targetPaymentStatus === "paid") {
    setImmediate(async () => {
      try {
        await sendPaymentConfirmationEmail(booking, payment);
      } catch (err) {
        console.error("Failed to send payment confirmation email", err.message);
      }
    });
  }

  return {
    paymentStatus: targetPaymentStatus,
    bookingStatus: targetBookingStatus,
    message: `Payment ${targetPaymentStatus}`,
    bookingId: booking._id,
    paymentId: payment._id
  };
}

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('bookingId').populate('userId', 'firstName lastName email');
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createFakePayment,
  getAllPayments,
  deletePayment,
};

