"use strict";

module.exports = ({ strapi }) => ({
  mailto(ctx) {
    const bodyRequest = ctx.request.body;

    strapi
      .plugin("free-mail-sender")
      .service("mailWorker")
      .sendEmail(bodyRequest);
  },
});
