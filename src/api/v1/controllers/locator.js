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
  fcm: strapi.service("api::firebase.firebase"),

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
    // console.log(data);
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
    // console.log(response);
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
      let msg = this.fcm.defaultMessage;
      console.log(msg);
      console.log(msg.data);
      msg.data.type = "request-location";
      msg.data.payload = {
        data: {
          phone: owner.phone,
          name: owner.firstname + " " + owner.lastname,
        },
        type: "request-location",
      };
      msg.data.title = "Location Request!";
      msg.data.body =
        owner.firstname +
        " " +
        owner.lastname +
        " (" +
        owner.phone +
        ")" +
        " wants to view your location.";

      //send notification command to FCM service.
      let response = await this.fcm.send({
        tokens: userTokens,
        data: msg,
      });

      // console.log(response);
      //if this command returns with failures
      if (response && response.failureCount > 0) {
        //run through the result to find the failures
        for (const [key, result] of Object.entries(response.results)) {
          //if result.error is not null, then its an error
          if (result.error != null) {
            //get the error code
            const code = result.error["errorInfo"].code;

            //If this is a token error, then delete the token from database.
            if (this.fcm.tokenErrors().includes(code)) {
              await strapi
                .service("api::v1.user-fcm-token")
                .deleteBadToken(userTokens[key]);
            }
          }
        }
        return core.response(false);
      }
    }

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
    // console.log(data);
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

  async respondToLocatorRequest(ctx) {
    const owner = ctx.state.user;
    const { data } = ctx.request.body;

    if (data.phone) {
      const { users, userTokens, userIds } = await strapi
        .service("api::v1.user-fcm-token")
        .getFCMTokensByUID([data.phone]);

      if (userTokens.length > 0) {
        //build message
        let msg = this.fcm.defaultMessage;
        msg.data.type = "general";
        msg.data.payload = {
          phone: data.phone,
          name: owner.firstname + " " + owner.lastname,
        };
        msg.data.title = data.accept
          ? "Location Request Granted!"
          : "Location Request Denied!";
        msg.data.body =
          owner.firstname +
          " " +
          owner.lastname +
          " (" +
          owner.phone +
          ")" +
          (data.accept
            ? " accepted your request to view their location."
            : " denied your request to view their location.");

        //send notification command to FCM service.
        let response = await this.fcm.send({
          tokens: userTokens,
          data: msg,
        });
      }
    }
    return core.response(true);
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
