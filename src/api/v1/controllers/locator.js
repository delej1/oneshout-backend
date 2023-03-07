"use strict";

const { isArray } = require("lodash");
const { sendLocatorRequestNotification } = require("../services/notification");
/**
 * locate-me controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::v1.locator", ({ strapi }) => ({
  api: "api::v1.locator",
  async findLocators(ctx) {
    const user = ctx.state.user;
    const { data } = ctx.request.body;
    console.log(data);
    const list = data.contacts; //? contacts.split(",") : [];

    const result = await strapi
      .query("plugin::users-permissions.user")
      .findMany({
        where: { phone: { $in: list } },
        select: ["id"],
        // populate: { locator: true },
      });

    let ids = result.map((a) => a.id);

    //check users which allow me view their location.
    const locators = await strapi.db.query("api::v1.locator").findMany({
      where: { locateMe: true, viewers: { $contains: user.phone } },
      populate: {
        user: {
          select: ["id", "phone"],
        },
      },
    });

    // console.log(locators);
    // return;
    // const res = await this.sanitize(contactsx);
    const response = await Promise.all(
      locators.map((c) => {
        console.log(c);
        return {
          id: c.id,
          locateMe: c.locateMe,
          lat: c.lat,
          lng: c.lng,
          lastSeen: c.updatedAt,
          phone: c.user.phone,
        };
      })
    );
    console.log(response);
    return core.response(response);
  },

  async requestLocator(ctx) {
    const owner = ctx.state.user;
    const { data } = ctx.request.body;

    const phone = data.phone;
    console.log(phone);

    const result = await sendLocatorRequestNotification({
      phone,
      message:
        owner.firstname +
        " " +
        owner.lastname +
        " wants to view your location.",
      userName: owner.firstname + " " + owner.lastname,
      userPhone: phone,
    });

    if (result.errors || result.recipients == 0) {
      return core.response(false);
    }

    return core.response(true);
  },

  async sanitize(result) {
    const sanitized = async (c) => {
      console.log(c);
      return {
        id: c.id,
        locateMe: c.locateMe,
        lat: c.user.locator.lng,
        lng: c.user.locator.lng,
        lastSeen: c.updatedAt,
        phone: c.user.phone,
      };
    };

    if (isArray(result)) {
      return await Promise.all(result.map((entry) => sanitized(entry)));
    } else {
      return sanitized(result);
    }
  },
}));
