"use strict";

/**
 * shout-location service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::v1.shout-location", ({ strapi }) => ({
  api: "api::v1.shout-location",
  async saveLocationChange({ id, lng, lat }) {
    try {
      const entry = await strapi
        .query(this.api)
        .findOne({ where: { shout: id } });

      let location = {
        timestamp: Date.now(),
        lng: lng,
        lat: lat,
      };

      if (entry) {
        entry.coordinates.push(location);

        await strapi.query(this.api).update({
          where: { shout: id },
          data: { coordinates: entry.coordinates },
        });
      } else {
        await strapi.query(this.api).create({
          data: {
            shout: id,
            coordinates: [location],
            watchers: [],
          },
        });
      }
    } catch (error) {
      console.log(error);
    }
  },

  async getLocations(id) {
    try {
      const entry = await strapi
        .query(this.api)
        .findOne({ where: { shout: id } });

      if (entry) {
        // console.log(entry);
        return entry.coordinates;
      } else {
        return [];
      }
    } catch (error) {
      console.log(error);
    }
  },
  //   async addLocationWatcher({ id, phone }) {
  //       const entry = await strapi.query(this.api).findOne({ where: { id: id } });

  //     if (entry) {
  //       await strapi.query(this.api).update({
  //         where: { shout: id },
  //         data: { watchers: [...entry.watchers].push({}) },
  //       });
  //     } else {
  //       await strapi.query(this.api).create({
  //         data: {
  //           shout: id,
  //           coordinates: [...entry.coordinates].push(location),
  //           watchers: [],
  //         },
  //       });
  //     }
  //   },
}));
