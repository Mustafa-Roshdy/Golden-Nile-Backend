const nodemailer = require('nodemailer');

// Email transporter configuration
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send booking confirmation to user
async function sendBookingConfirmationToUser(userEmail, userName, bookingDetails) {
  // Skip email sending if disabled
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('Email sending disabled - skipping customer confirmation email');
    return;
  }

  const { place, arrivalDate, leavingDate, memberNumber, roomNumber } = bookingDetails;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@tripplan.com',
    to: userEmail,
    subject: 'Booking Confirmation - TripPlan',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
        <p>Dear ${userName},</p>
        <p>Your booking has been confirmed successfully. Here are the details:</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Place:</strong> ${place.name}</p>
          <p><strong>Address:</strong> ${place.address}</p>
          <p><strong>Type:</strong> ${place.type === 'guest_house' ? 'Guest House' : 'Restaurant'}</p>
          ${place.type === 'guest_house' ? `<p><strong>Room Number:</strong> ${roomNumber || 'Not specified'}</p>` : ''}
          ${place.type === 'guest_house' ?
            `<p><strong>Check-in Date:</strong> ${new Date(arrivalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
             <p><strong>Check-out Date:</strong> ${new Date(leavingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
             <p><strong>Number of Guests:</strong> ${memberNumber}</p>` :
            `<p><strong>Reservation Date:</strong> ${new Date(arrivalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
             <p><strong>Reservation Time:</strong> ${new Date(arrivalDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
             <p><strong>Number of Tables:</strong> ${memberNumber}</p>`
          }
        </div>

        <p>We look forward to serving you. If you have any questions, please contact us.</p>
        <p>Best regards,<br>TripPlan Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending email to user:', error.message);
    // Don't throw error to avoid blocking booking creation
    // Email failures should not prevent successful bookings
  }
}

// Function to send booking notification to admin
async function sendBookingNotificationToAdmin(adminEmail, adminName, bookingDetails, customerDetails) {
  // Skip email sending if disabled
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('Email sending disabled - skipping admin notification email');
    return;
  }

  const { place, arrivalDate, leavingDate, memberNumber, roomNumber } = bookingDetails;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@tripplan.com',
    to: adminEmail,
    subject: 'New Booking Received - TripPlan',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">New Booking Received</h2>
        <p>Dear ${adminName},</p>
        <p>You have received a new booking for your place. Details below:</p>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Place Information:</h3>
          <p><strong>Place Name:</strong> ${place.name}</p>
          <p><strong>Address:</strong> ${place.address}</p>
          <p><strong>Type:</strong> ${place.type === 'guest_house' ? 'Guest House' : 'Restaurant'}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Information:</h3>
          <p><strong>Customer Name:</strong> ${customerDetails.firstName} ${customerDetails.lastName}</p>
          <p><strong>Email:</strong> ${customerDetails.email}</p>
          <p><strong>Phone:</strong> ${customerDetails.phone || 'Not provided'}</p>
        </div>

        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          ${place.type === 'guest_house' ? `<p><strong>Room Number:</strong> ${roomNumber || 'Not specified'}</p>` : ''}
          ${place.type === 'guest_house' ?
            `<p><strong>Check-in Date:</strong> ${new Date(arrivalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
             <p><strong>Check-out Date:</strong> ${new Date(leavingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
             <p><strong>Number of Guests:</strong> ${memberNumber}</p>` :
            `<p><strong>Reservation Date:</strong> ${new Date(arrivalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
             <p><strong>Reservation Time:</strong> ${new Date(arrivalDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
             <p><strong>Number of Tables:</strong> ${memberNumber}</p>`
          }
        </div>

        <p>Please prepare accordingly for the customer's ${place.type === 'guest_house' ? 'arrival' : 'reservation'}.</p>
        <p>Best regards,<br>TripPlan Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking notification email sent to admin: ${adminEmail}`);
  } catch (error) {
    console.error('Error sending email to admin:', error.message);
    // Don't throw error to avoid blocking booking creation
    // Email failures should not prevent successful bookings
  }
}

module.exports = {
  sendBookingConfirmationToUser,
  sendBookingNotificationToAdmin,
  sendPaymentConfirmationEmail,
};

// Payment confirmation email
async function sendPaymentConfirmationEmail(booking, payment) {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('Email sending disabled - skipping payment confirmation');
    return;
  }

  if (!booking?.user?.email) {
    console.warn("Payment email skipped - user email missing");
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@tripplan.com',
    to: booking.user.email,
    subject: 'Booking Payment Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Payment Confirmed</h2>
        <p>Hi ${booking.user.firstName || 'traveler'},</p>
        <p>Your payment was processed successfully.</p>
        <div style="background:#f7f7f7;padding:12px;border-radius:6px;margin:16px 0;">
          <p><strong>Booking:</strong> ${booking._id}</p>
          <p><strong>Place:</strong> ${booking.place?.name || 'Trip'}</p>
          <p><strong>Payment Method:</strong> ${payment.method}</p>
          <p><strong>Platform:</strong> ${payment.platform}</p>
          <p><strong>Amount:</strong> ${payment.amount}</p>
          <p><strong>Transaction:</strong> ${payment.fakeTransactionId}</p>
        </div>
        <p>Thank you for booking with TripPlan.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation email sent to ${booking.user.email}`);
  } catch (err) {
    console.error('Failed to send payment confirmation email:', err.message);
  }
}

