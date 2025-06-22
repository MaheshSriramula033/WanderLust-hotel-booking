const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

module.exports.renderSignUpForm = (req, res) => {
  res.render("users/signup");
};

module.exports.signUp = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check for existing email manually
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      req.flash("error", "Email is already registered. Please log in.");
      return res.redirect("/login");
    }

    // Proceed only if email is unique
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome! You're registered and logged in.");
      res.redirect("/listings");
    });
  } catch (e) {
  console.error("Registration Error:", e);

  if (e.code === 11000 && e.keyPattern && e.keyPattern.email) {
    req.flash("error", "That email is already registered. Try logging in.");
    return res.redirect("/login");
  }

  req.flash("error", "Something went wrong during registration.");
  res.redirect("/register");
}};


module.exports.renderLoginForm = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You have logged out.");
    res.redirect("/listings");
  });
};

// ✅ Add this for Google OAuth callback
module.exports.googleCallback = (req, res) => {
  req.flash("success", "Logged in with Google!");
  res.redirect("/listings");
};

// (Optional) If you want to show a message on Google login failure
module.exports.googleFailure = (req, res) => {
  req.flash("error", "Google login failed. Please try again.");
  res.redirect("/login");
};


module.exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "No user with that email found.");
      return res.redirect("/forgot");
    }

    const token = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
      }
    });

    const resetURL = `http://${req.headers.host}/reset/${token}`;

    const mailOptions = {
      to: user.email,
        from: `WanderLust Support <${process.env.EMAIL}>`,
      subject: "Password Reset",
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetURL}">here</a> to reset your password. This link expires in 1 hour.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    req.flash("success", "Password reset email sent.");
    res.redirect("/forgot");
  } catch (err) {
    console.error("Forgot password error:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/forgot");
  }
};

module.exports.renderResetForm = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Password reset link is invalid or has expired.");
    return res.redirect("/forgot");
  }

  res.render("users/reset", { token });
};

module.exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirm } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash("error", "Token is invalid or expired.");
      return res.redirect("/forgot");
    }

    if (password !== confirm) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("back");
    }

    await user.setPassword(password); // from passport-local-mongoose
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.login(user, (err) => {
      if (err) throw err;
      req.flash("success", "Your password has been reset and you are now logged in.");
      res.redirect("/listings");
    });
  } catch (err) {
    console.error("Reset password error:", err);
    req.flash("error", "Could not reset password.");
    res.redirect("/forgot");
  }
};
