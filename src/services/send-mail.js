import handlebars from "handlebars";
import fs from "fs";
const sgMail = require('@sendgrid/mail');
const path = require("path");

const appRoot = path.resolve(__dirname);

handlebars.registerHelper('multiply', function(a, b) {
  return a * b;
});

handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('currency', function(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'XCD'
  }).format(amount);
});

let readHTMLFile = function (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, function (err, html) {
      if (err) reject(err);
      else resolve(html);
    });
  });
};

export async function sendMail(
  emailData,
  replacements,
  htmlFileName = "mail-template.html",
  pdfBufferData = null,
  pdfFileName = null
) {
  try {
    const { SENDGRID_API_KEY, MAIL_FROM_ADDRESS } = process.env;
    sgMail.setApiKey(SENDGRID_API_KEY);

    const filePath = `${appRoot}/mail-templates/${htmlFileName}`;
    const html = await readHTMLFile(filePath);
    const template = handlebars.compile(html);
    const htmlsend = template(replacements);

    const msg = {
      to: emailData.to,
      from: emailData.from || MAIL_FROM_ADDRESS,
      subject: emailData.subject,
      html: htmlsend,
    };

    if (pdfBufferData) {
      msg.attachments = [{
        filename: pdfFileName,
        content: pdfBufferData.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment'
      }];
    }

    await sgMail.send(msg);
    console.log('Email sent via SendGrid');
    return "Email Sent!";
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export async function sendOtp(data) {
  const { SENDGRID_API_KEY } = process.env;
  sgMail.setApiKey(SENDGRID_API_KEY);
  
  const msg = {
    to: data.email,
    from: 'aman@spirehubs.com',
    subject: 'Verify Your Account',
    text: `Hi ${data.name},\n\nYour OTP is: ${data.otp}\n\nPlease use this OTP to verify your email.\n\nThank you!`,
    html: `
    <div style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; padding: 20px; max-width: 600px; margin: auto; border-radius: 10px;">
      <div style="text-align: center; background-color: #fff; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333; font-size: 24px; margin-bottom: 10px;">Verify Your Account</h2>
        <p style="color: #555; font-size: 16px;">Hi <strong style="color: #2c3e50;">${data.name} 🙋‍♂️</strong>,</p>
        <p style="color: #555; font-size: 16px;">Your OTP is:</p>
        <h3 style="color: #3c763d; font-size: 30px; font-weight: bold; padding: 10px; background-color: #e8f5e9; display: inline-block; border-radius: 5px;">${data.otp}</h3>
        <p style="color: #555; font-size: 16px; margin-top: 20px;">Please use this OTP to verify your email.</p>
        <hr style="border: 1px solid #ddd; margin: 30px 0;">
      </div>
    </div>
  `,
  };

  try {
    await sgMail.send(msg);
    console.log('OTP sent via SendGrid');
    return 'OTP Sent!';
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
}