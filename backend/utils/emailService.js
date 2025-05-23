const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `https://auction-bidding.vercel.app/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify your email address",
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

const sendAuctionNotification = async (email, auctionTitle, message) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: `Auction Update: ${auctionTitle}`,
    html: `
      <h1>Auction Update</h1>
      <p>${message}</p>
      <p>Visit our platform to view the auction details.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending auction notification:", error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendAuctionNotification,
};
