const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,       // ✅ Ensures no duplicate emails
    required: true,     // ✅ Good practice to require email
    sparse: true        // ✅ Optional if Google accounts may skip email
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  username: {
    type: String,
    required: true
  },
  displayName: String,
  profilePhoto: String,
  resetPasswordToken: String,
resetPasswordExpires: Date
});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);

