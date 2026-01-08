const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    global.mongoose = { conn: null, promise: null };
    mongoose.set('bufferCommands', false); // Force disable buffering globally
}

async function connectDB() {
    if (!cached) {
        cached = global.mongoose;
    }

    if (cached.conn) {
        console.log("Using cached MongoDB connection");
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable Mongoose buffering
        };

        console.log("Creating new MongoDB connection");
        cached.promise = mongoose.connect(`${process.env.DB_URL}/TripPlanDB`, opts).then((mongoose) => {
            console.log("MongoDB Connected (New)");
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

module.exports = connectDB;
