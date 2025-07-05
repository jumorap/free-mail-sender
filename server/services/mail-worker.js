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

/**
 * Imports AES key from raw buffer
 * @param {Buffer} keyBuffer - Raw AES key buffer
 * @returns {Promise<Object>} - Imported AES key
 */
const importAESKey = async (keyBuffer) => {
  return await crypto.webcrypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt']
  );
};

/**
 * Decrypts AES key using RSA private key
 * @param {string} encryptedAESKey - Base64 encoded encrypted AES key
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {Buffer} - Decrypted AES key buffer
 */
const decryptAESKeyWithRSA = (encryptedAESKey, privateKey) => {
  const keyBuffer = Buffer.from(encryptedAESKey, "base64");
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    keyBuffer
  );
};

/**
 * Decrypts data using AES-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} ivBase64 - Base64 encoded IV
 * @param {Object} aesKey - AES key object
 * @returns {Promise<string>} - Decrypted data
 */
const decryptWithAES = async (encryptedData, ivBase64, aesKey) => {
  const encryptedBuffer = Buffer.from(encryptedData, "base64");
  const iv = Buffer.from(ivBase64, "base64");
  
  const decryptedBuffer = await crypto.webcrypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    encryptedBuffer
  );
  
  return new TextDecoder().decode(decryptedBuffer);
};

const decryptData = async (ctx, encryptedPackage, privateKey) => {
  /**
   * Decrypt the encrypted package using hybrid decryption (RSA + AES)
   * @param {Object} ctx - The context object to send the response
   * @param {String} encryptedPackage - The encrypted package to decrypt
   * @param {String} privateKeyBase64 - The private key to decrypt the data
   * @returns {String} - The decrypted data
   */
  try {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    
    // Parse the encrypted package
    let packageData;
    try {
      const packageJson = Buffer.from(encryptedPackage, 'base64').toString('utf-8');
      packageData = JSON.parse(packageJson);
    } catch (parseError) {
      // Fallback to old encryption method if parsing fails
      const buffer = Buffer.from(encryptedPackage, "base64");
      const decryptedData = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        buffer
      );
      return decryptedData.toString("utf8");
    }
    
    // Extract components
    const { encryptedKey, encryptedData, iv } = packageData;
    
    if (!encryptedKey || !encryptedData || !iv) {
      throw new Error("Invalid encrypted package format");
    }
    
    // Decrypt AES key with RSA
    const aesKeyBuffer = decryptAESKeyWithRSA(encryptedKey, privateKey);
    
    // Import AES key
    const aesKey = await importAESKey(aesKeyBuffer);
    
    // Decrypt data with AES
    const decryptedData = await decryptWithAES(encryptedData, iv, aesKey);
    
    return decryptedData;
    
  } catch (error) {
    console.error("Decryption error:", error);
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
    ctx.body = { message: "Message sent", sent: true, info: info };
  });
};

module.exports = ({ strapi }) => ({
  async sendEmail(request) {
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

    const mailText = JSON.stringify(request?.mail);
    if (checkSentBefore(mailText)) {
      ctx.body = { error: "Mail already sent", sent: false };
      return;
    }

    const decryptedMailText = await decryptData(ctx, mailText, privateKey);
    if (!decryptedMailText) return; // Error already set in decryptData

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
