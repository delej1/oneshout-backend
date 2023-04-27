module.exports = {
  routes: [
    {
      method: "POST",
      path: "/v1/locators",
      handler: "locator.findLocators",
      config: { policies: [], middlewares: [] },
    },
  ],
};
