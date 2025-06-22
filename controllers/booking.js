const Booking = require("../models/booking");
const Listing=require("../models/listing");
const {generateBookingPDF} = require("../public/utils/pdfGenerator");
const sendBookingMail = require("../public/utils/mailer");
const fs = require("fs");


module.exports.bookListingNow=async(req,res)=>{
  const { id } = req.params;
  req.flash("success","Login success book now!");
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
today.setHours(0, 0, 0, 0); // Normalize to midnight

if (newCheckIn < today || newCheckOut <= newCheckIn) {
  req.flash("error", "Please select valid dates.");
  return res.redirect(`/listings/${listingId}`);
}

    // ✅ Conflict check only for this listing
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

    // ✅ Create booking
    const booking = await Booking.create({
      listing: listing._id,
      user: req.user._id,
      checkIn,
      checkOut,
      guests
    });
        // ✅ Flash message with email
    req.flash("success", `Booking confirmed! Details sent to ${req.user.email}`);
     res.redirect(`/listings/${listing._id}`);

    // ✅ Generate PDF
    const pdfPath = await generateBookingPDF(booking, req.user, listing);

    // ✅ Send email
    await sendBookingMail(
      `WanderLust Support <${process.env.EMAIL}>`,
      req.user.email,
      "Booking Confirmed!",
      "Please find attached your booking confirmation.",
      pdfPath
    );

    // ✅ Delete PDF after sending
    fs.unlink(pdfPath, (err) => {
      if (err) {
        console.error("⚠️ Failed to delete PDF:", err);
      } else {
        console.log("🧹 PDF deleted after email.");
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
    

    const listing = booking.listing;



    req.flash("success", `Booking cancelled successfully and confirmation email sent to ${req.user.email}`);

    // ✅ Respond to user immediately
    const redirectBack = req.get("Referer") || "/bookings";
    res.redirect(redirectBack);

    // ✅ Handle PDF + Email in the background
    const { generateCancellationPDF } = require("../public/utils/pdfGenerator");
    const sendBookingMail = require("../public/utils/mailer");

    const pdfPath = await generateCancellationPDF(booking, req.user, listing);

    await sendBookingMail(
      `WanderLust Support <${process.env.EMAIL}>`,
      req.user.email,
      "Booking Cancelled",
      "Your booking has been cancelled. Please find attached the cancellation confirmation.",
      pdfPath
    );

    // Delete the cancellation PDF
    fs.unlink(pdfPath, (err) => {
      if (err) console.error("PDF deletion error:", err);
    });

  } catch (err) {
    console.error("❌ Error cancelling booking:", err);
    // fallback error redirect
    res.redirect("/bookings");
  }
};
