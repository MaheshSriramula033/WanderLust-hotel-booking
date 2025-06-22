const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function calculateNights(checkIn, checkOut) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((checkOutDate - checkInDate) / millisecondsPerDay);
}

function generateBookingPDF(booking, user, listing) {
  return new Promise((resolve, reject) => {
    try {
      console.log("📄 PDF generation started...");

      const pdfFolder = path.join(__dirname, "pdfs");
      if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder, { recursive: true });

      const filePath = path.join(pdfFolder, `booking_${booking._id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const brandColor = "#FF385C";
      const nights = calculateNights(booking.checkIn, booking.checkOut);
      const pricePerNight = listing.price;
      const totalPrice = pricePerNight * nights;

      const logoPath = path.join(__dirname, "..", "assets", "logo.png");
      const logoWidth = 200;

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (doc.page.width - logoWidth) / 2, 40, { width: logoWidth });
        doc.moveDown(3);
      }

      doc
        .fontSize(10)
        .fillColor("gray")
        .text(`Booking ID: ${booking._id}`, { align: "center" })
        .moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#DDDDDD").stroke();
      doc.moveDown();

      doc.fontSize(16).fillColor(brandColor).text("Guest Details", { underline: true }).moveDown(0.5);
      doc.fontSize(12).fillColor("black")
        .text(`Name: ${user.displayName || user.username}`)
        .text(`Email: ${user.email}`)
        .moveDown();

      doc.fontSize(16).fillColor(brandColor).text("Stay Details", { underline: true }).moveDown(0.5);
      doc.fontSize(12).fillColor("black")
        .text(`Hotel: ${listing.title}`)
        .text(`Location: ${listing.location}`)
        .text(`Check-In: ${new Date(booking.checkIn).toDateString()}`)
        .text(`Check-Out: ${new Date(booking.checkOut).toDateString()}`)
        .text(`Guests: ${booking.guests}`)
        .text(`Nights: ${nights}`)
        .moveDown();

      doc.fontSize(16).fillColor(brandColor).text("Payment Summary", { underline: true }).moveDown(0.5);
      doc.fontSize(12).fillColor("black")
        .text(`Price per Night: $${pricePerNight}`)
        .text(`Total Nights: ${nights}`)
        .font("Helvetica-Bold")
        .text(`Total Price: $${totalPrice}`)
        .font("Helvetica")
        .moveDown();

      doc.moveDown().fontSize(10).fillColor("gray")
        .text("Thank you for booking with WanderLust. For support, contact support@wanderlust.com", { align: "center" });

      doc.end();

      stream.on("finish", () => {
        console.log("✅ PDF created:", filePath);
        resolve(filePath);
      });

      stream.on("error", (err) => {
        console.error("❌ Stream error:", err);
        reject(err);
      });
    } catch (error) {
      console.error("❌ PDF generation failed:", error);
      reject(error);
    }
  });
}

function generateCancellationPDF(booking, user, listing) {
  return new Promise((resolve, reject) => {
    try {
      console.log("📄 Generating cancellation PDF...");

      const pdfFolder = path.join(__dirname, "pdfs");
      if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder, { recursive: true });

      const filePath = path.join(pdfFolder, `booking_cancelled_${booking._id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const brandColor = "#FF385C";
      const alertColor = "#FF4C4C";
      const nights = calculateNights(booking.checkIn, booking.checkOut);
      const pricePerNight = listing.price;
      const totalPrice = pricePerNight * nights;

      const logoPath = path.join(__dirname, "..", "assets", "logo.png");
      const logoWidth = 200;

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (doc.page.width - logoWidth) / 2, 40, { width: logoWidth });
        doc.moveDown(3);
      }

      doc.fillColor(alertColor).fontSize(24).font("Helvetica-Bold").text("Booking Cancelled", { align: "center" }).moveDown(1);

      doc.fontSize(10).fillColor("gray").text(`Booking ID: ${booking._id}`, { align: "center" }).moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#DDDDDD").stroke();
      doc.moveDown();

      doc.fontSize(16).fillColor(brandColor).text("Guest Details", { underline: true }).moveDown(0.5);
      doc.fontSize(12).fillColor("black")
        .text(`Name: ${user.displayName || user.username}`)
        .text(`Email: ${user.email}`)
        .moveDown();

      doc.fontSize(16).fillColor(brandColor).text("Stay Details", { underline: true }).moveDown(0.5);
      doc.fontSize(12).fillColor("black")
        .text(`Hotel: ${listing.title}`)
        .text(`Location: ${listing.location}`)
        .text(`Original Check-In: ${new Date(booking.checkIn).toDateString()}`)
        .text(`Original Check-Out: ${new Date(booking.checkOut).toDateString()}`)
        .text(`Guests: ${booking.guests}`)
        .text(`Nights: ${nights}`)
        .moveDown();

      doc.fontSize(16).fillColor(brandColor).text("Payment Summary", { underline: true }).moveDown(0.5);
      doc.fontSize(12).fillColor("black")
        .text(`Price per Night: $${pricePerNight}`)
        .text(`Total Nights: ${nights}`)
        .font("Helvetica-Bold")
        .text(`Total Refunded: $${totalPrice}`, { fill: alertColor })
        .font("Helvetica")
        .moveDown();

      doc.moveDown().fontSize(10).fillColor("gray")
        .text("Your booking has been successfully cancelled. Refund will be processed within 5–7 business days.", { align: "center" })
        .moveDown(0.5)
        .text("Need help? Email us at support@wanderlust.com", { align: "center" });

      doc.end();

      stream.on("finish", () => {
        console.log("✅ Cancellation PDF created:", filePath);
        resolve(filePath);
      });

      stream.on("error", (err) => {
        console.error("❌ Stream error:", err);
        reject(err);
      });

    } catch (error) {
      console.error("❌ PDF generation failed:", error);
      reject(error);
    }
  });
}

function generateHostWelcomePDF(user) {
  return new Promise((resolve, reject) => {
    try {
      console.log("📄 Generating Host Welcome PDF...");

      const pdfFolder = path.join(__dirname, "pdfs");
      if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder, { recursive: true });

      const filePath = path.join(pdfFolder, `host_welcome_${user._id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const brandColor = "#FF385C";
      const logoPath = path.join(__dirname, "..", "assets", "logo.png");
      const logoWidth = 180;

      // Logo
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (doc.page.width - logoWidth) / 2, 40, { width: logoWidth });
        doc.moveDown(3);
      }

      // Title
      doc.fillColor(brandColor)
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("🎉 Welcome to WanderLust Hosting!", { align: "center" })
        .moveDown(1);

      // User Info
      doc.fontSize(12).fillColor("black")
        .text(`Name: ${user.displayName || user.username}`)
        .text(`Email: ${user.email}`)
        .moveDown();

      // Body Message
      doc.moveDown()
        .fontSize(14)
        .fillColor("black")
        .text(`Dear ${user.displayName || user.username},`)
        .moveDown(0.5)
        .fontSize(12)
        .text(`We’re thrilled to welcome you as a host on WanderLust. Your journey in helping guests discover unforgettable places begins now!`)
        .moveDown()
        .text(`From cozy cabins to seaside getaways, we can't wait to see the unique spaces you'll share with the world.`)
        .moveDown();

      // Support
      doc.fontSize(12)
        .fillColor("gray")
        .text(`Need assistance? Reach out to us at support@wanderlust.com`, { align: "center" })
        .moveDown(1)
        .fontSize(10)
        .text("Thank you for being a part of our community.", { align: "center" });

      doc.end();

      stream.on("finish", () => {
        console.log("✅ Host Welcome PDF created:", filePath);
        resolve(filePath);
      });

      stream.on("error", (err) => {
        console.error("❌ Stream error:", err);
        reject(err);
      });

    } catch (err) {
      console.error("❌ PDF generation failed:", err);
      reject(err);
    }
  });
}


module.exports = {
  generateBookingPDF,
  generateCancellationPDF,
 generateHostWelcomePDF
};









