'use strict';

module.exports = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('oneshout')
      .service('myService')
      .getWelcomeMessage();
  },
});
