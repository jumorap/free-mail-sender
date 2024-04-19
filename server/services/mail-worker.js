'use strict';

const nodemailer = require("nodemailer");

const checkFields = (fields) => {
  if (!fields.toEmail) return { allowed: false, error: 'To email is required' };
  if (!fields.subject) return { allowed: false, error: 'Subject is required' };
  if (!fields.mailText) return { allowed: false, error: 'Html text is required' };

  return { allowed: true };
}

const emailSenderWorker = (ctx, fields) => {
  let transporter = nodemailer.createTransport({
    host: fields.hostProvider,
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.PASSWORD_SENDER
    }
  });

  let mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: fields.toEmail,
    subject: fields.subject,
    html: fields.mailText
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) ctx.body = {error: error, sent: false};
  });
};

module.exports = ({ strapi }) => ({
  sendEmail(request) {
    const ctx = strapi.requestContext.get();
    ctx.body = { message: 'Message sent', sent: true };

    const defaultProvider = 'outlook'
    const provider = strapi.plugin('free-mail-sender')?.config('provider').toLowerCase() || defaultProvider;
    let hostProvider = '';

    if (provider === 'gmail') hostProvider = 'smtp.gmail.com ';
    else if (provider === 'outlook') hostProvider = 'smtp.office365.com';
    else if (provider === 'yahoo') hostProvider = 'smtp.mail.yahoo.com';
    else if (provider === 'zoho') hostProvider = 'smtp.zoho.com';
    else if (provider === 'sendgrid') hostProvider = 'smtp.sendgrid.net';
    else if (provider === 'mailgun') hostProvider = 'smtp.mailgun.org';
    else if (provider === 'yandex') hostProvider = 'smtp.yandex.com';
    else if (provider === 'protonmail') hostProvider = 'smtp.protonmail.com';
    else if (provider === 'icloud') hostProvider = 'smtp.mail.me.com';
    else if (provider === 'aol') hostProvider = 'smtp.aol.com';
    else if (provider === 'zohomail') hostProvider = 'smtp.zoho.eu';
    else if (provider === 'gmx') hostProvider = 'smtp.gmx.com';

    const fields = {
      hostProvider: hostProvider,
      toEmail: request?.toEmail,
      subject: request?.subject,
      mailText: request?.mailText
    }

    const allowToSend = checkFields(fields);

    if (allowToSend.allowed) emailSenderWorker(ctx, fields);
    else ctx.body = { error: allowToSend.error, sent: false };
  }
});
