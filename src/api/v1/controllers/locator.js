"use strict";

/**
 * locate-me controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::v1.locator", ({ strapi }) => ({
  api: "api::v1.locator",
  async findLocators(ctx) {
    const user = ctx.state.user;
  },
}));
