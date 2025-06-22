const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
require("dotenv").config();
const passport = require("passport");
require("./passport");
const bookingRoutes = require("./routes/booking");
const listingRoutes = require("./routes/listings");
const reviewRoutes = require("./routes/reviews");
const userRoutes=require("./routes/user");
const cookieParser = require('cookie-parser');
const helmet = require('helmet');




app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); 

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com"
      ],
      scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com"
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com"
      ],
      styleSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com"
      ],

      fontSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],

      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://images.unsplash.com",
        "https://plus.unsplash.com",
        "https://cdn.jsdelivr.net",
        "https://keralatourpackagesguide.com",
        "https://cornwallcottages4you.co.uk",
        "https://www.masaimara.com",
        "https://cf.bstatic.com",
        "https://www.essence.com",
        "https://w0.peakpx.com",
        "https://i.pinimg.com",
        "https://r2imghtlak.mmtcdn.com",
        "https://media.vrbo.com",
        "https://media.glampinghub.com",
        "https://media-cdn.tripadvisor.com",
        "https://images.trvl-media.com",
        "https://photographafrica.com",
        "https://encrypted-tbn0.gstatic.com",
        "https://www.historic-uk.com",
        "https://tinyhousetalk.com",
        "https://magazine.compareretreats.com",
        "https://www.compass.com",
        "https://www.tigersafariindia.com",
        "https://a0.muscache.com",
        "https://img.freepik.com",
        "https://www.russinfo.in",
        // Required for Leaflet maps
        "https://unpkg.com",
        "https://raw.githubusercontent.com",
        "https://a.tile.openstreetmap.org",
        "https://b.tile.openstreetmap.org",
        "https://c.tile.openstreetmap.org"
      ],

      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  })
);




// Set up session
app.use(session({
  secret: process.env.SECRECT_KEY, // ideally from process.env
  resave: false,
  saveUninitialized: false,
    store: MongoStore.create({
    mongoUrl: process.env.DB_URL, // same DB prURL
    collectionName: 'sessions', // optional, default is 'sessions'
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure:true
  }
}));
app.use(flash());


// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Tell passport to use the strategy provided by passport-local-mongoose
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next) => {
  res.locals.currentUser = req.user; // Now accessible in every EJS file
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
mongoose.connect(process.env.DB_URL)
  .then(() => console.log("Connected to DB"))
  .catch(err => console.log(err));

// Routes

app.use("/", userRoutes);           // handles /login, /register
app.use("/bookings", bookingRoutes); // you MUST add this line
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/listings", listingRoutes); // keep this LAST



app.get("/", (req, res) => {
  res.redirect("/listings");
});


app.listen(process.env.PORT, () => {
  console.log("Server is running on port 8080");
});






