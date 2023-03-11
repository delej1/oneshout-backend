"use strict";

const { isArray } = require("lodash");
const {
  sendLocatorRequestNotification,
  sendShoutNotification,
} = require("../services/notification");
const { isObject } = require("lodash");

/**
 * locate-me controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::v1.locator", ({ strapi }) => ({
  api: "api::v1.locator",
  async findLocators(ctx) {
    const user = ctx.state.user;
    const { data } = ctx.request.body;

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

    return core.response(response);
  },

  async requestLocator(ctx) {
    const owner = ctx.state.user;
    const { data } = ctx.request.body;

    const { users, userTokens, userIds } = await strapi
      .service("api::v1.user-fcm-token")
      .getFCMTokensByUID([data.phone]);

    if (userTokens.length > 0) {
      //build message
      let msg = strapi.service("api::firebase.firebase").defaultMessage;
      msg.data.type = "request-location";
      msg.data.payload = {};
      // msg.notification.title = owner.phone;
      msg.notification.body =
        owner.firstname +
        " " +
        owner.lastname +
        " (" +
        owner.phone +
        ")" +
        " wants to view your location.";

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
        return core.response(false);
      }
    }

    // const phone = data.phone;
    // console.log(phone);
    // const result = await sendLocatorRequestNotification({
    //   phone,
    //   message:
    //     owner.firstname +
    //     " " +
    //     owner.lastname +
    //     " wants to view your location.",
    //   userName: owner.firstname + " " + owner.lastname,
    //   userPhone: phone,
    // });

    // console.log(result);
    // if (result.errors || result.recipients == 0) {
    //   return core.response(false);
    // }

    return core.response(true);
  },

  async updateLocation(ctx) {
    const user = ctx.state.user;
    const { data } = ctx.request.body;
    if (!isObject(data)) {
      return ctx.badRequest('Missing "data" payload in the request body');
    }
    try {
      await strapi.db.query(this.api).update({
        where: {
          user: user.id,
        },
        data: {
          lng: data.lng,
          lat: data.lat,
          lastSeen: new Date().toISOString(),
        },
      });
      return core.response(true);
    } catch (error) {
      return ctx.badRequest(error, error.details);
    }
  },

  async updateCanLocate(ctx) {
    const user = ctx.state.user;
    const { data } = ctx.request.body;

    if (!isObject(data)) {
      return ctx.badRequest('Missing "data" payload in the request body');
    }

    try {
      await strapi.db.query(this.api).update({
        where: {
          user: user.id,
        },
        data: {
          locateMe: data.canLocateMe,
          viewers: data.viewers.join(","),
        },
      });

      return core.response(true);
    } catch (error) {
      return ctx.badRequest(error, error.details);
    }
  },

  async sanitize(result) {
    const sanitized = async (c) => {
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
