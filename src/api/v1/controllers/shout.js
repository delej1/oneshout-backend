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
  fcm: strapi.service("api::firebase.firebase"),

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
    const owner = ctx.state.user;

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

    si.message = `${owner.firstname} ${owner.lastname} (${owner.phone}) needs help! They are at * ${si.latitude},${si.longitude} *`;

    try {
      const result = await this.q.create({
        data: {
          ...si,
          user: owner.id,
        },
        populate: {
          user: { select: ["id", "firstname", "lastname", "phone"] },
        },
      });

      const so = await this.sanitize(result);
      const date = new Date();
      await strapi.service("api::v1.shout-location").create({
        data: {
          shout: result.id,
          coordinates: [
            {
              timestamp: date.toISOString(),
              lng: so.longitude,
              lat: so.latitude,
            },
          ],
        },
      });

      //send the shout notifications.
      let rec = so.recipients.split(",");

      const res = await strapi.service(this.api).update(result.id, {
        data: {
          tracker_channel: `tracker_${owner.id}_${so.id}`,
        },
        populate: {
          user: { select: ["id", "firstname", "lastname", "phone"] },
          location: { select: ["coordinates"] },
        },
      });

      const shout = await this.sanitize(res);

      // console.log(shout);
      const sent = await this.sendNotification(shout);

      await strapi.service(this.api).update(result.id, {
        data: {
          notified: sent,
        },
        populate: {
          user: { select: ["id", "firstname", "lastname", "phone"] },
          location: { select: ["coordinates"] },
        },
      });
      // console.log(so);
      return core.response(so);
    } catch (error) {
      return ctx.badRequest(error, error.details);
    }
  },

  async sendNotification(shout) {
    const { users, userTokens, userIds } = await strapi
      .service("api::v1.user-fcm-token")
      .getFCMTokensByUID(shout.recipients.split(","));

    if (userTokens.length > 0) {
      //build message
      let msg = this.fcm.defaultMessage();
      msg.data.type = "shout-help";
      msg.data.payload = { data: shout, type: "shout-help" };
      msg.data.title = "ALERT!";
      msg.data.body = shout.message;

      //android settings.
      msg.android.notification.channelId = "com.ebs.shout.channel";
      //ios settings
      msg.apns.payload.aps.sound = "alarm.caf";
      //send notification command to FCM service.
      let response = await this.fcm.send({
        tokens: userTokens,
        data: msg,
      });

      // console.log(response);
      //if this command returns with failures
      if (response) {
        return userTokens.length - response.failureCount;
      }
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
        filters: {
          $not: { user: null },
          recipients: { $contains: owner.phone.trim() },
        },
        populate: {
          user: { select: ["id", "firstname", "lastname", "phone"] },
          location: { select: ["coordinates"] },
        },
      });

      if (results) {
        let shouts = await this.sanitize(results);
        // console.log(shouts);
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

    const sent = await this.sendCancelNotification(sendTo, name);
    return core.response({});
  },

  async sendCancelNotification(recipients, name) {
    const { users, userTokens, userIds } = await strapi
      .service("api::v1.user-fcm-token")
      .getFCMTokensByUID(recipients);

    // console.log(recipients);
    // console.log(userTokens);
    if (userTokens.length > 0) {
      //build message
      let msg = this.fcm.defaultMessage();
      msg.data.type = "cancel-shout";
      msg.data.payload = { type: "cancel-shout" };
      msg.data.title = "ONE SHOUT";
      msg.data.body = name + " is safe now. Thanks for your concern.";

      //android settings.
      msg.android.notification.channelId = "com.ebs.shout.channel";
      //ios settings
      msg.apns.payload.aps.sound = "alarm.caf";

      //send notification command to FCM service.
      let response = await this.fcm.send({
        tokens: userTokens,
        data: msg,
      });

      if (response) {
        return userTokens.length - response.failureCount;
      }
    }
    return 0;
  },
}));
