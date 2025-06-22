const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // your email
    pass: process.env.PASS,   // App password (not your actual password)
  },
});

async function sendBookingMail(to, subject, text, attachmentPath) {
console.log("Sending email to:", to);

  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    text,
    attachments: [
      {
        filename: "booking-confirmation.pdf",
        path: attachmentPath,
      },
    ],
  });
}

module.exports = sendBookingMail;
