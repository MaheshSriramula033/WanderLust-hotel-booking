const express = require("express");
const router = express.Router({ mergeParams: true });

const validateReview = require("../middleware/validateReview");
const { isLoggedIn, isReviewAuthor } = require("../middleware/isLoggedIn");
const reviewController = require("../controllers/review");

// Create Review
router.post("/", isLoggedIn, validateReview, reviewController.createReview);

// Delete Review
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, reviewController.deleteReview);

module.exports = router;

