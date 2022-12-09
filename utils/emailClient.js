require("dotenv").config();
var nodemailer = require("nodemailer");

exports.emailClient = (subject, content, recipient) => {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.APP_EMAIL_PASSWORD,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: recipient,
      subject: subject,
      html: content,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else if (info) {
        resolve(info);
      }
    });
  });
};
