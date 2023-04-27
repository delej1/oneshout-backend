"use strict";
const { parsePhoneNumber } = require("libphonenumber-js");

module.exports = ({ strapi }) => ({
  async importSubscribers(ctx) {
    const { data, subscription } = ctx.request.body;

    try {
      let addedCount = 0;
      let existsCount = 0;
      let subscriberIds = [];

      //get ids of subscribers.
      subscription.subscribers.forEach((s) => subscriberIds.push(s.id));

      for (const u of data) {
        let user;
        //check if user exists.
        const user_exists = await strapi
          .query("plugin::users-permissions.user")
          .findOne({
            where: { phone: u.phone },
          });

        if (user_exists) {
          user = user_exists;
        } else {
          const number = parsePhoneNumber(u.phone);
          if (number) {
            user = await strapi.api["auth"].controller("auth").createUser({
              ...u,
              password: u.phone,
              country: number.country,
            });
          }
        }

        //add user to subscription.
        if (subscriberIds.includes(user.id)) {
          existsCount = existsCount + 1;
        } else {
          await strapi.api["v1"]
            .service("subscription")
            .addUserToSubscription(subscription, user);

          addedCount++;
        }
      }
      ctx.body = {
        addedCount: addedCount,
        existsCount: existsCount,
      };
    } catch (error) {
      console.log(error);
    }
  },
});
