const Joi = require("joi");

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().required().messages({
      "string.empty": "Title is required."
    }),
    category: Joi.string()
      .valid("Beach", "Mountain", "City", "Countryside", "Desert", "Lake", "Amazing Views")
      .required()
      .messages({
        "any.only": "Please select a valid category.",
        "string.empty": "Category is required."
      }),
    description: Joi.string().allow("").max(1000).messages({
      "string.max": "Description must be less than 1000 characters."
    }),
    price: Joi.number().min(0).required().messages({
      "number.base": "Price must be a number.",
      "number.min": "Price cannot be negative.",
      "any.required": "Price is required."
    }),
    location: Joi.string().trim().required().messages({
      "string.empty": "Location is required."
    }),
    country: Joi.string().trim().required().messages({
      "string.empty": "Country is required."
    })
  }).required()
});

module.exports = (req, res, next) => {
  const { error } = listingSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map(el => el.message).join(", ");
    req.flash("error", errorMessages);
    return res.redirect("back");
  }
  next();
};




