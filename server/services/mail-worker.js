"use strict";

const nodemailer = require("nodemailer");

const checkFields = (fields) => {
  /**
   * Check if the required fields are filled
   * @param {Object} fields - The fields to check
   * @returns {Object} - The allowed status and error message
   */
  if (!fields.toEmail) return { allowed: false, error: "To email is required" };
  if (!fields.subject) return { allowed: false, error: "Subject is required" };
  if (!fields.mailText)
    return { allowed: false, error: "Html text is required" };

  return { allowed: true };
};

const emailSenderWorker = (strapi, ctx, fields) => {
  /**
   * Send the email with the required fields to the recipient using the nodemailer library
   * and the email sender credentials from the .env file
   * @param {Object} strapi - The strapi object to access the env variables
   * @param {Object} ctx - The context object to send the response
   * @param {Object} fields - The fields to send the email
   * @returns {Object} - The response object in case of an error
   */
  let transporter = nodemailer.createTransport({
    host: fields.hostProvider,
    port: 587,
    secure: false,
    auth: {
      user: strapi.plugin("free-mail-sender")?.config("sender") || "",
      pass: strapi.plugin("free-mail-sender")?.config("PASSWORD_SENDER") || "",
    },
  });

  let mailOptions = {
    from: strapi.plugin("free-mail-sender")?.config("sender") || "",
    to: fields.toEmail,
    subject: fields.subject,
    html: fields.mailText,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) ctx.body = { error: error, sent: false };
    ctx.body = { message: "Message sent", sent: true, info: info }; // Trick to wait for the email to be sent
  });
};

module.exports = ({ strapi }) => ({
  sendEmail(request) {
    /**
     * Create the email fields and send the email if the required fields are filled
     * @param {Object} request - The request object with the email fields
     * @returns {Object} - The response object with the message sent status
     */
    const ctx = strapi.requestContext.get();
    ctx.body = { message: "Message sent", sent: true };

    const defaultProvider = "outlook";
    const providerConfig = strapi
      .plugin("free-mail-sender")
      ?.config("provider")
      ?.toLowerCase();
    const provider = providerConfig || defaultProvider;

    let hostProvider = "";
    const providers = {
      gmail: "smtp.gmail.com",
      outlook: "smtp.office365.com",
      yahoo: "smtp.mail.yahoo.com",
      zoho: "smtp.zoho.com",
      sendgrid: "smtp.sendgrid.net",
      mailgun: "smtp.mailgun.org",
      yandex: "smtp.yandex.com",
      protonmail: "smtp.protonmail.com",
      icloud: "smtp.mail.me.com",
      aol: "smtp.aol.com",
      zohomail: "smtp.zoho.eu",
      gmx: "smtp.gmx.com",
    };

    if (providers.hasOwnProperty(provider)) hostProvider = providers[provider];
    else hostProvider = providers[defaultProvider];

    const fields = {
      hostProvider: hostProvider,
      toEmail: request?.toEmail,
      subject: request?.subject,
      mailText: request?.mailText,
    };

    const allowToSend = checkFields(fields);

    if (allowToSend.allowed) emailSenderWorker(strapi, ctx, fields);
    else ctx.body = { error: allowToSend.error, sent: false };
  },
});
