"use strict";

/**
 * user-fcm-token service.
 */

const { createCoreService } = require("@strapi/strapi").factories;
const { remove, isEqual } = require("lodash");
const moment = require("moment");

module.exports = createCoreService("api::v1.user-fcm-token", ({ strapi }) => ({
  model: "api::v1.user-fcm-token",
  /**
   * Updates a user's FCMToken list
   * @param {String} uid
   * @param {string} token
   */
  async updateFcmToken(user, oldToken, newToken) {
    let done;
    let uid = user.uid;
    console.log(uid);
    console.log(oldToken);
    console.log(newToken);
    // //find the user with this uid
    // let user = await strapi
    //   .query("plugin::users-permissions.user")
    //   .findOne({ where: { uid: uid } });

    // if (!user) {
    //   return null;
    // }

    //if no oldToken is sent, create new record.
    if (!oldToken) {
      let result;
      //find newToken record that matches the userId
      let tkn = await strapi
        .query(this.model)
        .findOne({ where: { uid: uid, token: newToken } });

      //if record for this deviceId exists,
      //replace it with the new token
      if (tkn) {
        result = await strapi
          .service(this.model)
          .update(tkn.id, { data: { token: newToken } });
      } else {
        //create new token record for this userId
        result = await strapi
          .service(this.model)
          .create({ data: { uid: uid, token: newToken, user: user } });
      }
      //return true if successful.
      return result ? true : false;
    } else {
      let result;
      //find oldToken record that matches the userId
      let tkn = await strapi
        .query(this.model)
        .findOne({ where: { uid: uid, token: oldToken } });

      //if record for this deviceId exists,
      //replace it with the new token
      if (tkn) {
        result = await strapi
          .service(this.model)
          .update(tkn.id, { data: { token: newToken } });
      } else {
        //create new token record for this userId
        result = await strapi
          .service(this.model)
          .create({ data: { uid: uid, token: newToken, user: user } });

        //return true if successful.
        return result ? true : false;
      }

      return result ? true : false;
    }

    return done;
  },

  /**
   * Get FCMTokens for a list of uid.
   * @param {array} uidList
   */
  async getFCMTokensByUID(uidList) {
    const userIds = [];
    const userTokens = [];

    //get the token record for userIds
    const users = await strapi
      .query("plugin::users-permissions.user")
      .findMany({
        select: ["uid", "firstname"],
        where: { uid: { $in: uidList } },
        populate: {
          tokens: { select: ["id", "token"] },
        },
      });

    for (const user of users) {
      if (user.tokens) {
        for (const token of user.tokens) {
          if (token.token) {
            userIds.push(user.id);
            userTokens.push(token.token);
          }
        }
      }
    }

    return { users, userTokens, userIds };
  },

  /**
   * Delete bad token from db.
   * @param {array} uidList
   */
  async deleteBadToken(token) {
    //get the token record for deviceId
    const result = await strapi.query(this.model).delete({
      where: { token: token },
    });

    return result;
  },

  /**
   * Clean up the FCM tokens stored in the db.
   */
  async cleanUpFCMTokens() {
    console.log(`Cleaning up FCM tokens...`);
    const date = new Date();
    const lastMonthDate = moment().subtract(30, "days").toISOString();

    // console.log(lastMonthDate);
    //find all tokens that was last updated 1 month ago.
    const { results } = await strapi.service(this.model).find({
      filters: {
        $and: [
          { updatedAt: { $lte: lastMonthDate } },
          { token: { $notNull: true } },
          { token: { $ne: "" } },
        ],
      },
    });

    if (results.length > 0) {
      const tokens = [];
      for (const token of results) {
        if (token.token) {
          tokens.push(token.token);
        }
      }

      //dry run the tokens with FCM
      try {
        const result = await strapi
          .service("api::firebase.firebase")
          .dryRunTokens(tokens);

        const validTokens = [];
        const invalidTokens = [];

        if (result) {
          for (const [key, response] of Object.entries(result.responses)) {
            //get db id for this token
            const id = results[key].id;
            if (response.success) {
              validTokens.push(id);
            } else {
              invalidTokens.push(id);
            }
          }

          //run update on valid tokens
          // console.log("validTokens=", validTokens);
          await strapi.db.query(this.model).updateMany({
            where: { id: { $in: validTokens } },
            data: { updatedAt: Date.now() },
          });
          console.log(`Refreshed ${validTokens.length} valid token(s).`);

          //run delete on invalid tokens
          // console.log("invalidTokens=", invalidTokens);
          const deleted = await strapi.db.query(this.model).deleteMany({
            where: {
              $or: [
                { id: { $in: invalidTokens } },
                { token: null },
                { token: "" },
              ],
            },
          });

          console.log(`Deleted ${deleted.count} invalid token(s).`);
        }
      } catch (error) {
        console.log(error);
      }
    }
  },
}));
