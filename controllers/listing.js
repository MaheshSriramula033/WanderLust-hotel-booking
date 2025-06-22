const Listing=require("../models/listing");
const Review=require("../models/reviews");
const { cloudinary } = require("../cloudinary");
const geocoder = require('../geocode'); // your geocode.js file
const Booking = require("../models/booking");
const {generateHostWelcomePDF} = require("../public/utils/pdfGenerator");
const sendBookingMail = require("../public/utils/mailer");
const fs = require("fs");
const cookie = require('cookie');
module.exports.index = async (req, res) => {
  const { category, q } = req.query;
  let filter = {};

  if (category) {
    filter.category = category;
  }

  if (q) {
    // Case-insensitive search in title, location, and description
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  try {
    const alllistings = await Listing.find(filter);
    res.render('listings/index', { alllistings, category, searchQuery: q });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/');
  }
};



module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
};


module.exports.createListing = async (req, res) => {
  try {
    const geoData = await geocoder.geocode(req.body.listing.location);

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename
      };
    }

    // Set geo coordinates if available
    if (geoData.length > 0) {
      newListing.geometry = {
        type: 'Point',
        coordinates: [geoData[0].longitude, geoData[0].latitude]
      };
    }

    await newListing.save();

    // Generate Host Welcome PDF
    const pdfPath = await generateHostWelcomePDF(req.user);

    // Send Welcome Email with PDF attachment
    await sendBookingMail({
      to: req.user.email,
      subject: "Welcome to WanderLust Hosting!",
      text: `Hi ${req.user.displayName || req.user.username},\n\nThank you for becoming a host! Please find your welcome guide attached.`,
      attachments: [
        {
          filename: `host_welcome_${req.user._id}.pdf`,
          path: pdfPath
        }
      ]
    });

    req.flash("success", `Listing created! Welcome email sent ${req.user.email}`);
    res.redirect(`/listings/${newListing._id}`);

    fs.unlink(pdfPath, (err) => {
      if (err) {
        console.error("⚠️ Failed to delete PDF:", err);
      } else {
        console.log("🧹 PDF deleted after email.");
      }
    });

  } catch (error) {
    console.error("❌ Error creating listing or sending email:", error);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/listings/new");
  }
};


module.exports.showListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: { path: "author" }
    })
    .populate("owner")
    .populate("likes");

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  // 👇 Try to find a booking for this listing and the logged-in user
  let booking = null;
  if (req.user) {
    booking = await Booking.findOne({ listing: listing._id, user: req.user._id });
  }

  res.render("listings/show", {
    listing,
    currentUser: req.user, // 👈 pass this if you're using it in your EJS
    booking                // 👈 now booking is defined in the EJS template
  });
};

module.exports.renderEditForm=async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }
  res.render("listings/edit", { listing });
};


module.exports.updateListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  // Check if location has changed
  const newLocation = req.body.listing.location;
  const oldLocation = listing.location;

  if (newLocation && newLocation !== oldLocation) {
    const geoData = await geocoder.geocode(newLocation);
    if (geoData.length > 0) {
      listing.geometry = {
        type: 'Point',
        coordinates: [geoData[0].longitude, geoData[0].latitude]
      };
    }
  }

  // Update basic fields
  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.location = newLocation;
  listing.country = req.body.listing.country;

  // Update image if a new one is uploaded
  if (req.file) {
    await cloudinary.uploader.destroy(listing.image.filename); // delete old image
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  await listing.save();
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${listing._id}`);
};



module.exports.deleteListing=async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }
  await Review.deleteMany({ _id: { $in: listing.reviews } });
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};

module.exports.privacy=async(req,res)=>{
  res.render('includes/privacy');
}
module.exports.terms=async(req,res)=>{
res.render('includes/terms');
};

module.exports.like = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  const userId = req.user._id;
  let liked = false;

  if (!listing.likes.includes(userId)) {
    listing.likes.push(userId);
    liked = true;
  } else {
    listing.likes.pull(userId);
    liked = false;
  }

  await listing.save();

  // === Update cookie ===
  let likedListings = req.cookies.likedListings ? JSON.parse(req.cookies.likedListings) : [];

  if (liked) {
    if (!likedListings.includes(listing._id.toString())) {
      likedListings.push(listing._id.toString());
    }
  } else {
    likedListings = likedListings.filter(id => id !== listing._id.toString());
  }

  res.cookie('likedListings', JSON.stringify(likedListings), {
    httpOnly: false, // must be accessible from client-side JavaScript
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.json({ liked, totalLikes: listing.likes.length });
  }

  req.flash('success', liked ? 'Added to favorites!' : 'Removed from favorites.');
  res.redirect(`/listings/${listing._id}`);
};