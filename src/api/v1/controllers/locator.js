"use strict";

const { isArray } = require("lodash");

/**
 * locate-me controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::v1.locator", ({ strapi }) => ({
  api: "api::v1.locator",
  async findLocators(ctx) {
    const user = ctx.state.user;
    console.log(user);
    const contacts = await strapi.db.query("api::v1.contact").findMany({
      where: { user: user.id },
      populate: {
        user: {
          select: ["id"],
          populate: {
            locator: { select: ["id", "lat", "lng", "locator", "updatedAt"] },
          },
        },
      },
    });

    const res = await this.sanitize(contacts);

    console.log(res);
  },

  async sanitize(result) {
    const sanitized = async (c) => {
      console.log(c);
      return {
        id: c.id,
        firstname: c.firstname,
        lastname: c.lastname,
        phone: c.phone,
        locatorOn: c.user.locator.locator,
        lat: c.user.locator.lng,
        lng: c.user.locator.lng,
        lastUpdated: c.user.locator.updatedAt,
      };
    };

    if (isArray(result)) {
      return await Promise.all(result.map((entry) => sanitized(entry)));
    } else {
      return sanitized(result);
    }
  },
}));
