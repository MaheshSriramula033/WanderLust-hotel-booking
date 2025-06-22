const Review=require("../models/reviews");
const Listing=require("../models/listing");


module.exports.createReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body.review || {};
  const parsedRating = parseInt(rating, 10);

  // Validate rating range
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    req.flash("error", "Please select a valid rating (1–5).");
    return res.redirect(`/listings/${id}`);
  }

  try {
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    const newReview = new Review({
      rating: parsedRating,
      comment,
      author: req.user._id
    });

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    req.flash("success", "Review added!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error("Error creating review:", err);
    req.flash("error", "Something went wrong while submitting your review.");
    res.redirect(`/listings/${id}`);
  }
};




module.exports.deleteReview=async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted.");
  res.redirect(`/listings/${id}`);
}


