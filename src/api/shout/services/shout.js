'use strict';

/**
 * shout service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::shout.shout');
