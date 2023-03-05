module.exports = {
  routes: [
    {
      method: "GET",
      path: "/v1/locators",
      handler: "locator.findLocators",
      config: { policies: [], middlewares: [] },
    },
  ],
};
