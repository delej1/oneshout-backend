"use strict";

/**
 * shout service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const { isArray } = require("lodash");

module.exports = createCoreService("api::v1.shout", ({ strapi }) => ({
  model: "api::v1.shout",
  q: strapi.query("api::v1.shout"),
  async sanitize(result) {
    const sanitized = async (shout) => {
      // console.log(shout.location);
      return {
        id: shout.id,
        date: shout.date,
        recipients: shout.recipients,
        message: shout.message,
        latitude: shout.latitude ?? "0.0",
        longitude: shout.longitude ?? "0.0",
        // user: shout.user,
        senderId: shout.user.id,
        senderName: shout.user.firstname + " " + shout.user.lastname,
        senderPhone: shout.user.phone,
        sent: shout.sent,
        type: shout.type,
        trackerChannel: shout.tracker_channel,
        status: shout.status,
        locations: shout.location ? shout.location.coordinates : [],
      };
    };

    if (isArray(result)) {
      return await Promise.all(result.map((entry) => sanitized(entry)));
    } else {
      return sanitized(result);
    }
  },
}));
