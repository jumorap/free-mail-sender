module.exports = {
  malto: {
    type: "content-api",
    routes: [
      {
        method: "POST",
        path: "/send-email",
        handler: "controller.mailto",
        config: {
          policies: [],
        },
      },
    ],
  },
};
