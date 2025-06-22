const mongoose = require("mongoose");
const Booking = require("../models/booking");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("Connected to DB for cleanup.");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Booking.deleteMany({ checkOut: { $lt: today } });
    console.log(`🧹 Deleted ${result.deletedCount} expired bookings.`);

    mongoose.connection.close();
  })
  .catch(err => {
    console.error("DB connection error:", err);
  });
