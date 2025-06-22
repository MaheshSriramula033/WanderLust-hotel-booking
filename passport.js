const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true  // 👈 Required to read 'state'
    },
    async (req, accessToken, refreshToken, profile, done) => {
      const mode = req.query.state; // 'login' or 'signup'
      const email = profile.emails[0].value;

      try {
        let user = await User.findOne({ googleId: profile.id });

        // ✅ If logging in
        if (mode === "login") {
          if (user) return done(null, user);

          // ❌ Google account exists by email but not linked
          const existingByEmail = await User.findOne({ email });
          if (existingByEmail) {
            return done(null, false, {
              message: "Please log in with email and password first."
            });
          }

          return done(null, false, {
            message: "No account found. Please sign up first."
          });
        }

        // ✅ If signing up
        if (mode === "signup") {
          // Block if email already exists
          const emailExists = await User.findOne({ email });
          if (emailExists) {
            return done(null, false, {
              message: "Email already registered. Please log in instead."
            });
          }

          // Create new user
          const newUser = await User.create({
            googleId: profile.id,
            email: email,
            username: email,
            displayName: profile.displayName,
            profilePhoto: profile.photos[0]?.value
          });

          return done(null, newUser);
        }

        // Fallback
        return done(null, false, { message: "Invalid request mode." });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


// Sessions
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

