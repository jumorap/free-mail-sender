"use strict";

const nodemailer = require("nodemailer");
const crypto = require("crypto");

let mails = [];
module.exports = { mails };

const checkFields = (fields) => {
  /**
   * Check if the required fields are filled
   * @param {Object} fields - The fields to check
   * @returns {Object} - The allowed status and error message
   */
  if (!fields.toEmail) return { allowed: false, error: "Invalid token" }; // TO email is required
  if (!fields.subject) return { allowed: false, error: "Invalid token" }; // Subject is required
  if (!fields.mailText) return { allowed: false, error: "Invalid token" }; // Mail text is required

  return { allowed: true };
};

const decryptData = (ctx, encryptedData, privateKey) => {
  /**
   * Decrypt the encrypted data using the private key
   * @param {Object} ctx - The context object to send the response
   * @param {String} encryptedData - The encrypted data to decrypt
   * @param {String} privateKeyBase64 - The private key to decrypt the data
   * @returns {String} - The decrypted data
   */
  try {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    const buffer = Buffer.from(encryptedData, "base64");
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      buffer
    );
    return decryptedData.toString("utf8");
  } catch (error) {
    ctx.body = { error: "Invalid token", sent: false };
    return;
  }
};

const encryptData = (data, publicKey) => {
  /**
   * Encrypt the data using the public key
   * @param {String} data - The data to encrypt
   * @param {String} publicKey - The public key to encrypt the data
   * @returns {String} - The encrypted data
   */
  publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  const buffer = Buffer.from(data, "utf8");
  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );
  return encryptedData.toString("base64");
};

const plainToJson = (plain) => {
  /**
   * Convert the plain text to a JSON object
   * @param {String} plain - The plain text to convert
   * @returns {Object} - The JSON object
   */
  try {
    const jsonMail = JSON.parse(plain);
    if (typeof jsonMail === "object") return jsonMail;
  } catch (error) {
    return { error: error };
  }
};

const checkSentBefore = (mailText) => {
  /**
   * Check if the email was sent before
   * @param {Object} strapi - The strapi object
   * @param {String} mailText - The email text to check
   * @returns {Boolean} - The email sent status
   */
  const mail = mails.find((m) => m === mailText);
  if (mail) return true;
  mails.push(mailText);
  return false;
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
      pass: strapi.plugin("free-mail-sender")?.config("pass") || "",
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
    const provider =
      strapi.plugin("free-mail-sender")?.config("provider")?.toLowerCase() ||
      defaultProvider;

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

    const privateKey = strapi.plugin("free-mail-sender")?.config("token") || "";
    if (!privateKey) {
      ctx.body = { error: "Back-end token is required", sent: false };
      return;
    }
    // const publicKey = ``;
    const mailText = JSON.stringify(request?.mail);
    if (checkSentBefore(mailText)) {
      ctx.body = { error: "Mail already sent", sent: false };
      return;
    }
    // const cryptedMailText = encryptData(mailText, publicKey);
    const decryptedMailText = decryptData(ctx, mailText, privateKey);

    request = plainToJson(decryptedMailText);

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
