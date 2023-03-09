"use strict";
const { isEmpty, filter } = require("lodash");

/**
 * A set of functions called "actions" for `auth`
 */

module.exports = {
  tokenErrors() {
    return ["messaging/invalid-registration-token"];
  },
  /**
   * Updates a user's FCMToken list
   * @param {string} uid
   * @param {string} token
   */
  async updateFcmToken(ctx) {
    const { data } = ctx.request.body;
    if (isEmpty(data)) {
      return ctx.badRequest("Request body can not empty.", {});
    }

    const { uid, oldToken, newToken } = data;
    if (!uid || !newToken) {
      return ctx.badRequest("UID and Token are required.", {});
    }

    const done = await strapi
      .service("api::user-fcm-token.user-fcm-token")
      .updateFcmToken(uid, oldToken, newToken);

    return core.response(done != null);
  },

  sendFcm: async (ctx) => {
    const { data } = ctx.request.body;
    if (isEmpty(data)) {
      return ctx.badRequest("Request body can not empty.", {});
    }

    const { sender, recipients, message, type, payload } = data;

    if (!sender) {
      return ctx.badRequest("Sender UID is required.", {});
    }
    if (!recipients) {
      return ctx.badRequest("Notification recipients is required.", {});
    }
    if (!message) {
      return ctx.badRequest("Message is required.", {});
    }
    if (!type) {
      return ctx.badRequest("Message type is required.", {});
    }
    if (!payload) {
      return ctx.badRequest("Payload is required.", {});
    }

    let tokenErrors = [
      "messaging/invalid-registration-token",
      "messaging/registration-token-not-registered",
    ];
    //get tokens for recipients

    const { users, userTokens, userIds } = await strapi
      .service("api::user-fcm-token.user-fcm-token")
      .getFCMTokensByUID(recipients);

    if (userTokens.length > 0) {
      //build message
      let msg = strapi.service("api::firebase.firebase").defaultMessage;
      msg.data.type = type;
      msg.data.payload = payload ?? {};
      msg.data.title = sender;
      msg.data.body = message;

      //send notification command to FCM service.
      let response = await strapi.service("api::firebase.firebase").send({
        tokens: userTokens,
        data: msg,
      });

      //if this command returns with failures
      if (response && response.failureCount > 0) {
        //run through the result to find the failures
        for (const [key, result] of Object.entries(response.results)) {
          //if result.error is not null, then its an error
          if (result.error != null) {
            //get the error code
            const code = result.error["errorInfo"].code;

            //If this is a token error, then delete the token from database.
            if (tokenErrors.includes(code)) {
              await strapi
                .service("api::user-fcm-token.user-fcm-token")
                .deleteBadToken(userTokens[key]);
            }
          }
        }
      }
    }

    return core.response({});
  },
};
