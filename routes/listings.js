const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listing");
const validateListing = require("../middleware/validateListing");
const { isLoggedIn, isOwner } = require("../middleware/isLoggedIn");
const multer = require("multer");
const { storage } = require("../cloudinary"); // ✅ Cloudinary storage
const upload = multer({ storage }); // ✅ Uses Cloudinary

// Routes

// Index route
router.get("/", listingController.index);

// New listing form
router.get("/new", isLoggedIn, listingController.renderNewForm);
//terms
router.get("/terms",listingController.terms);

// Create listing (Cloudinary upload)
router.post("/add", isLoggedIn, upload.single("image"), listingController.createListing);

//privacy
router.get("/privacy",listingController.privacy);


// Show listing
router.get("/:id", listingController.showListing);

// Delete listing
router.delete("/:id", isLoggedIn, isOwner, listingController.deleteListing);

// Edit form
router.get("/:id/edit", isLoggedIn, isOwner, listingController.renderEditForm);

// Update listing (Cloudinary upload + validation)
router.put(
  "/:id/edit/confirm",
  isLoggedIn,
  isOwner,
  upload.single("image"),
  validateListing,
  listingController.updateListing
);

router.post("/:id/like", isLoggedIn, listingController.like );



module.exports = router;
