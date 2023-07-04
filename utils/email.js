const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const CustomError = require("./customError");

dotenv.config({ path: "../config.env" });

const mail = async function (email, subject, msg) {
  let transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  let mailOptions = {
    from: `donotreply.com`,
    to: email,
    subject: subject,
    text: msg,
    html: msg
  };
  await transport.sendMail(mailOptions);
};
module.exports = mail;
