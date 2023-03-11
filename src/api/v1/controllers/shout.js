"use strict";

/**
 * shout controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const { isObject } = require("lodash");
const {
  sendShoutNotification,
  cancelShoutNotification,
} = require("../services/notification");

module.exports = createCoreController("api::v1.shout", ({ strapi }) => ({
  api: "api::v1.shout",
  q: strapi.query("api::v1.shout"),
  service: () => {
    return strapi.service("api::v1.shout");
  },
  sanitize(data) {
    return strapi.service(this.api).sanitize(data);
  },

  /**
   * Creates an Shout.
   * @param {*} ctx
   * @returns {object} Shout object.
   */
  async create(ctx) {
    const { data } = ctx.request.body;
    const owner = ctx.state.user.id;

    if (!isObject(data)) {
      return ctx.badRequest('Missing "data" payload in the request body');
    }
    if (!data.recipients) {
      return ctx.badRequest("Recipients is required.");
    }
    if (!data.type) {
      return ctx.badRequest("Shout Type is required.");
    }

    const si = await this.sanitizeInput(data, ctx);

    try {
      const result = await this.q.create({
        data: {
          ...si,
          user: owner,
        },
        populate: {
          user: { select: ["id", "firstname", "lastname", "phone"] },
        },
      });
      const so = await this.sanitize(result);

      await strapi.service("api::v1.shout-location").create({
        data: {
          shout: result.id,
          coordinates: [
            { timestamp: Date.now(), lng: so.longitude, lat: so.latitude },
          ],
        },
      });

      //send the shout notifications.
      let rec = so.recipients.split(",");

      const sent = await this.sendNotification({
        message: so.message,
        recipients: rec,
        shoutId: so.id,
        longitude: so.longitude,
        latitude: so.latitude,
      });

      // const sent = await sendShoutNotification({
      //   message: so.message,
      //   recipients: rec,
      //   shoutId: so.id,
      //   longitude: so.longitude,
      //   latitude: so.latitude,
      // });

      // if (sent.errors) {
      //   so.notified = 0;
      // } else {
      //   so.notified = sent.recipients;
      // }

      await strapi.service(this.api).update(result.id, {
        data: {
          notified: sent,
          tracker_channel: `tracker_${owner}_${so.id}`,
        },
      });

      // console.log(so);
      return core.response(so);
    } catch (error) {
      return ctx.badRequest(error, error.details);
    }
  },

  async sendNotification({
    recipients,
    message,
    shoutId,
    longitude,
    latitude,
  }) {
    const { users, userTokens, userIds } = await strapi
      .service("api::v1.user-fcm-token")
      .getFCMTokensByUID(recipients);

    if (userTokens.length > 0) {
      //build message
      let msg = strapi.service("api::firebase.firebase").defaultMessage;
      msg.data.type = "shout-help";
      msg.data.payload = { shoutId, longitude, latitude };
      msg.notification.title = "ALERT!";
      msg.notification.body = message;

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
                .service("api::v1.user-fcm-token")
                .deleteBadToken(userTokens[key]);
            }
          }
        }
      }

      return userTokens.length - response.failureCount;
    }
    return 0;
  },

  /**
   * Find shouts for a user.
   * @param {*} ctx
   */
  async find(ctx) {
    const owner = ctx.state.user;
    const { pagination: paging } = ctx.query;

    try {
      const { results, pagination } = await strapi.service(this.api).find({
        sort: { id: "desc" },
        pagination: paging
          ? {
              withCount: true,
              pageSize: paging.pageSize || 10,
              page: paging.page,
            }
          : null,
        filters: { recipients: { $contains: owner.phone.trim() } },
        populate: {
          user: { select: ["id", "firstname", "lastname", "phone"] },
          location: { select: ["coordinates"] },
        },
      });

      if (results) {
        let shouts = await this.sanitize(results);
        console.log(shouts);
        return core.response(shouts, pagination);
      } else {
        return core.response([]);
      }
    } catch (error) {
      return ctx.badRequest(error, error.details);
    }
  },

  async cancelShout(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const entry = await strapi.service(this.api).update(id, {
      data: {
        status: "safe",
      },
      populate: { user: { select: ["id", "firstname", "lastname"] } },
    });

    const sendTo = entry.recipients.split(",");
    const name = entry.user.firstname + " " + entry.user.lastname;

    const sent = await cancelShoutNotification({
      message: name + " is safe now. Thanks for your concern.",
      recipients: sendTo,
    });

    return core.response({});
  },
}));
