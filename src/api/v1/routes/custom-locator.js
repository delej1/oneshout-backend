module.exports = {
  routes: [
    {
      method: "POST",
      path: "/v1/locators",
      handler: "locator.findLocators",
      config: { policies: [], middlewares: [] },
    },
    {
      method: "POST",
      path: "/v1/locators/request",
      handler: "locator.requestLocator",
      config: { policies: [], middlewares: [] },
    },
    {
      method: "POST",
      path: "/v1/locators/locator-request-response",
      handler: "locator.respondToLocatorRequest",
      config: { policies: [], middlewares: [] },
    },
    {
      method: "POST",
      path: "/v1/locators/update-location",
      handler: "locator.updateLocation",
      config: { policies: [], middlewares: [] },
    },
    {
      method: "POST",
      path: "/v1/locators/update-can-locate",
      handler: "locator.updateCanLocate",
      config: { policies: [], middlewares: [] },
    },
  ],
};
