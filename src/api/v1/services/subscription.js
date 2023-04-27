"use strict";

/**
 * subscription service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::v1.subscription", ({ strapi }) => ({
  model: "api::v1.subscription",
  /**
   *
   * @param {*} subscription
   * @param {*} user
   * @returns 1 if user already subscribed, 0 otherwise
   */
  async addUserToSubscription(subscription, user) {
    try {
      let subscribers = subscription.subscribers;

      subscribers.push(user.id);
      await strapi.db.query(this.model).update({
        where: { id: subscription.id },
        data: { subscribers: [...subscribers] },
      });
    } catch (error) {
      console.log(error);
    }
  },
}));
