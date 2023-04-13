"use strict";

/**
 * subscription service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::v1.subscription");
