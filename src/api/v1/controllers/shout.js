"use strict";

/**
 * shout controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const { isObject } = require("lodash");
const { sendShoutNotification } = require("../services/notification");

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
        populate: { user: { select: ["id", "firstname", "lastname"] } },
      });

      const so = await this.sanitize(result);

      //send the shout notifications.
      let rec = so.recipients.split(",");
      const sent = await sendShoutNotification({
        message: so.message,
        recipients: rec,
        shoutId: so.id,
        longitude: so.longitude,
        latitude: so.latitude,
      });

      if (sent.errors) {
        so.notified = 0;
      } else {
        so.notified = sent.recipients;
      }

      await strapi.service(this.api).update(result.id, {
        data: { notified: so.notified },
      });

      console.log(so);
      return core.response(so);
    } catch (error) {
      return ctx.badRequest(error, error.details);
    }
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
        pagination: {
          withCount: true,
          pageSize: paging.pageSize || 10,
          page: paging.page,
        },
        filters: { recipients: { $contains: owner.phone.trim() } },
      });

      let shouts = await this.sanitize(results);

      return core.response(shouts, pagination);
    } catch (error) {
      return ctx.badRequest(error, error.details);
    }
  },
}));
