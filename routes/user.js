const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user");
const { saveRedirectUrl } = require("../middleware/isLoggedIn");

// Register Form
router.route("/register")
  .get(userController.renderSignUpForm)
  .post(userController.signUp);

// Login Form
router.route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true
    }),
    userController.login
  );

// Google OAuth: Signup
router.get("/auth/google/signup",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "signup"
  })
);

// Google OAuth: Login
router.get("/auth/google/login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "login"
  })
);

// Google OAuth: Callback
router.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: true
  }),
  (req, res) => {
    const redirectUrl = req.session.returnTo || "/listings";
    delete req.session.returnTo;
    req.flash("success", `Welcome back, ${req.user.displayName || req.user.username}`);
    res.redirect(redirectUrl);
  }
);

// Logout
router.post("/logout", userController.logout);
router
  .route("/forgot")
  .get((req, res) => res.render("users/forgot"))
  .post(userController.forgotPassword);

router
  .route("/reset/:token")
  .get(userController.renderResetForm)
  .post(userController.resetPassword);

module.exports = router;

