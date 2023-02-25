"use strict";

/**
 * shout controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const { isObject } = require("lodash");

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
        populate: { user: { select: ["id"] } },
      });

      const so = await this.sanitize(result);

      return core.response(so);
    } catch (error) {
      return ctx.badRequest(error, error.details);
    }
  },
}));
