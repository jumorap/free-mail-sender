module.exports = [
  {
    method: 'POST',
    path: '/send-email',
    handler: 'controller.mailto',
    config: {
      policies: [],
    },
  }
]
