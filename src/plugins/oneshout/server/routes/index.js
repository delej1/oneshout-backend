module.exports = [
  {
    method: "GET",
    path: "/",
    handler: "myController.index",
    config: {
      policies: [],
    },
  },
  {
    method: "POST",
    path: "/subscriptions/import-subscribers",
    handler: "subscriptions.importSubscribers",
    config: {
      policies: [],
    },
  },
];
