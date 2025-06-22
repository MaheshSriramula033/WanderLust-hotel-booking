const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/isLoggedIn");
const bookingController = require("../controllers/booking");

// View user's bookings
router.get("/",isLoggedIn,bookingController.getUserBookings);
router.get("/:id/book", isLoggedIn, bookingController.bookListingNow);

router.post("/:id/book",isLoggedIn,bookingController.bookListing);


router.delete("/:id/cancel", isLoggedIn, bookingController.cancelBooking);


module.exports = router;
