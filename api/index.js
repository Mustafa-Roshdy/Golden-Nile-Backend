const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require('dotenv').config();


// MongoDB Connection
main().catch((err) => console.log(err));

async function main() {
  try {
    await mongoose.connect(`${process.env.DB_URL}/TripPlanDB`);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

const BookingRoute = require("./routes/bookingRoute.js");
const TripPlanRoutes = require("./routes/tripPlanRoute.js");
const UserRoutes = require("./routes/userRoute.js");
const ProgramRoutes = require("./routes/programRoute.js");
const PlaceRoutes = require("./routes/placeRoute.js");
const AuthRoutes = require("./routes/authRoute.js");
const PostRoutes = require("./routes/postRoute.js");
const TravelRoutes = require("./routes/travelRoute.js");
const ContactRoutes = require("./routes/contactRoute.js");
const ReviewRoutes = require("./routes/reviewRoute.js");
const AttractionRoutes = require("./routes/attractionRoute.js");
const SupervisorsRoutes = require("./routes/supervisorRoute.js");
const TravelAdviceRoutes = require("./routes/travelAdviceRoute.js");
const ConversationRoutes = require("./routes/conversationRoute.js");
const PaymentRoutes = require("./routes/paymentRoute.js");

const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow all for real-time
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
//   transports: ["websocket", "polling"],
// });

// app.set("io", io);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
];

app.use(cors());

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static serving for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



// Routes
app.use("/api", AuthRoutes)
app.use("/api", BookingRoute);
app.use("/api", TripPlanRoutes);
app.use("/api", UserRoutes);
app.use("/api", ProgramRoutes);
app.use("/api", PlaceRoutes);
app.use("/api", PostRoutes);
app.use("/api", TravelRoutes);
app.use("/api", ContactRoutes);
app.use("/api", ReviewRoutes);
app.use("/api", AttractionRoutes);
app.use("/api/supervisor", SupervisorsRoutes);
app.use("/api", TravelAdviceRoutes);
app.use("/api", ConversationRoutes);
app.use("/api", PaymentRoutes);

// Socket logic
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   socket.on("join_conversation", (conversationId) => {
//     socket.join(conversationId);
//     console.log(`✅ User ${socket.id} joined conversation: ${conversationId}`);
//   });

//   socket.on("join_user_room", (userId) => {
//     socket.join(userId);
//     console.log(`🏡 User ${socket.id} joined personal room: ${userId}`);
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
// });

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Server
// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => {
//   console.log(`Server & Socket Running at port ${PORT}`);
// });

module.exports = app;