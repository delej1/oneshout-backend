module.exports = {
  routes: [
    {
      method: "POST",
      path: "/v1/shouts",
      handler: "shout.create",
      config: { policies: [], middlewares: [] },
    },
  ],
};
