const Booking = require("../models/booking");
const Listing = require("../models/listing");
const {
  generateBookingPDF,
  generateCancellationPDF
} = require("../public/utils/pdfGenerator");
const sendBookingMail = require("../public/utils/mailer");
const fs = require("fs");

module.exports.bookListingNow = async (req, res) => {
  const { id } = req.params;
  req.flash("success", "Login success book now!");
  res.redirect(`/listings/${id}`);
};

module.exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("listing")
    .sort({ checkIn: -1 });

  res.render("listings/booking", { bookings });
};

module.exports.bookListing = async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.body;
    const listingId = req.params.id;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newCheckIn < today || newCheckOut <= newCheckIn) {
      req.flash("error", "Please select valid dates.");
      return res.redirect(`/listings/${listingId}`);
    }

    const existing = await Booking.findOne({
      listing: listingId,
      $or: [
        {
          checkIn: { $lt: newCheckOut },
          checkOut: { $gt: newCheckIn }
        }
      ]
    });

    if (existing) {
      req.flash("error", "This listing is already booked for the selected dates.");
      return res.redirect(`/listings/${listingId}`);
    }

    const booking = await Booking.create({
      listing: listing._id,
      user: req.user._id,
      checkIn,
      checkOut,
      guests
    });

    // ✅ Show success and redirect immediately
    req.flash("success", `Booking confirmed! Details sent to ${req.user.email}`);
    res.redirect(`/listings/${listing._id}`);

    // ✅ Run PDF and email logic in background
    setImmediate(async () => {
      try {
        const pdfPath = await generateBookingPDF(booking, req.user, listing);
        await sendBookingMail(
          `WanderLust Support <${process.env.EMAIL}>`,
          req.user.email,
          "Booking Confirmed!",
          "Please find attached your booking confirmation.",
          pdfPath
        );
        fs.unlink(pdfPath, (err) => {
          if (err) console.error("⚠️ Failed to delete PDF:", err);
          else console.log("🧹 PDF deleted after email.");
        });
      } catch (error) {
        console.error("❌ Background task error (booking):", error);
      }
    });

  } catch (err) {
    console.error("❌ Error in bookListing:", err);
    req.flash("error", "An error occurred while processing your booking.");
    return res.redirect("/listings");
  }
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("listing");

    if (!booking || !booking.user.equals(req.user._id)) {
      req.flash("error", "Unauthorized to cancel this booking.");
      return res.redirect("back");
    }

    // Update status to cancelled
    booking.status = "cancelled";
    await booking.save();

    const listing = booking.listing;

    // Flash message and redirect
    req.flash("success", `Booking cancelled successfully and confirmation email sent to ${req.user.email}`);
    const redirectBack = req.get("Referer") || "/bookings";
    res.redirect(redirectBack);

    // Run PDF/email in background
    setImmediate(async () => {
      try {
        const pdfPath = await generateCancellationPDF(booking, req.user, listing);
        await sendBookingMail(
          `WanderLust Support <${process.env.EMAIL}>`,
          req.user.email,
          "Booking Cancelled",
          "Your booking has been cancelled. Please find attached the cancellation confirmation.",
          pdfPath
        );
        fs.unlink(pdfPath, (err) => {
          if (err) console.error("PDF deletion error:", err);
          else console.log("🧹 Cancellation PDF deleted.");
        });
      } catch (err) {
        console.error("❌ Background task error (cancellation):", err);
      }
    });

  } catch (err) {
    console.error("❌ Error cancelling booking:", err);
    res.redirect("/bookings");
  }
};
