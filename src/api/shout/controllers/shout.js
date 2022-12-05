'use strict';

/**
 * shout controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::shout.shout');
