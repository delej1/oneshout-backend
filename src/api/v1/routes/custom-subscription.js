module.exports = {
  routes: [
    {
      method: "POST",
      path: "/v1/subscriptions/verify-purchase",
      handler: "subscription.verifyPurchase",
      config: { policies: [], middlewares: [] },
    },
  ],
};
