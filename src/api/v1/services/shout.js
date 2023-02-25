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
      return {
        id: shout.id,
        date: shout.date,
        recipients: shout.recipients,
        message: shout.message,
        latitude: shout.latitude,
        longitude: shout.longitude,
        user: shout.user,
        sent: shout.sent,
        type: shout.type,
      };
    };

    if (isArray(result)) {
      return await Promise.all(result.map((entry) => sanitized(entry)));
    } else {
      return sanitized(result);
    }
  },
}));
