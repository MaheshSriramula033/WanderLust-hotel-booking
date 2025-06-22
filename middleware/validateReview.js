// middleware/validateReview.js
const Joi = require("joi");

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required()
  }).required()
});

module.exports = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details.map(el => el.message).join(", "));
    return res.redirect("back");
  }
  next();
};
