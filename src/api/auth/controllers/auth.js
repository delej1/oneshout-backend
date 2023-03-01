"use strict";
const { createCoreController } = require("@strapi/strapi").factories;
const bcrypt = require("bcryptjs");
const { sendOTP } = require("../../v1/services/sendchamp");
const tokenCodes = require("referral-codes");
/**
 * A set of functions called "actions" for `auth`
 */

module.exports = {
  select: [
    "id",
    "phone",
    "email",
    "firstname",
    "lastname",
    "country",
    "blocked",
    "confirmed",
  ],
  populate: { role: { select: ["type"] } },

  /**
   * Send OTP
   * @param {*} ctx
   */
  async sendOTP(ctx) {
    const user = ctx.state.user;
    const { phone, firstname, channel } = ctx.request.body;
    const token = tokenCodes.generate({
      length: 6,
      count: 1,
      charset: "0123456789",
    })[0];

    try {
      //save OTP first.
      const result = await strapi
        .query("plugin::users-permissions.user")
        .update({
          where: { id: user.id },
          data: {
            confirmationToken: token,
          },
        });

      if (result) {
        const vt = await sendOTP({ token, phone, firstname, channel });
        ctx.body = vt;
      } else {
        ctx.badRequest(
          "Your verification token was not sent. Please try again in a few minutes."
        );
      }
    } catch (error) {
      ctx.error = error;
    }
  },
  async verifyOTP(ctx) {
    const user = ctx.state.user;
    const { token } = ctx.request.body;

    //get the user.
    if (user.confirmationToken != token) {
      ctx.badRequest("Your verification token is invalid.");
    }

    try {
      const result = await strapi
        .query("plugin::users-permissions.user")
        .update({
          where: { id: user.id },
          data: {
            confirmationToken: null,
            confirmed: true,
          },
        });
      if (result) {
        ctx.body = true;
      }
    } catch (error) {
      ctx.error = error;
    }
  },

  async register(ctx) {
    let user;
    let jwt;

    const { firstname, lastname, phone, email, country, password } =
      ctx.request.body;

    if (!phone) {
      //throw error: token is not found
      return ctx.badRequest("Phone number is required.", {});
    }
    if (!password) {
      //throw error: token is not found
      return ctx.badRequest("Password is required.", {});
    }
    if (!firstname || !lastname) {
      //throw error: token is not found
      return ctx.badRequest("First and Last name is required.", {});
    }
    if (!country) {
      //throw error: token is not found
      return ctx.badRequest("Country is required.", {});
    }
    if (!email) {
      //throw error: token is not found
      return ctx.badRequest("Email address is required.", {});
    }

    try {
      let cleanPhone = phone.replace("+", "");
      const qp = {
        firstname,
        lastname,
        country,
        phone: cleanPhone,
        email,
        password,
      };

      //check for user with phone
      const user_exists = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { phone: qp.phone },
          select: this.select,
          populate: this.populate,
        });

      if (user_exists) {
        return ctx.badRequest("A user already exists with this phone number.", {
          code: "user-creation-failed",
        });
      }

      //create user
      user = await this._createUser(qp);

      if (!user) {
        //user not created successfully
        return ctx.badRequest("User not created successfully", {
          code: "user-creation-failed",
        });
      }

      //fetch user's jwt token
      jwt = strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      });

      user.id = user.id.toString();
      user.isSubscriber = user.role.type == "subscriber";

      let userData = {
        user: this._sanitizeUser(user),
        jwt,
      };

      //return api response
      ctx.body = {
        data: userData,
      };
    } catch (error) {
      console.log(error);
      ctx.error = error;
    }
  },

  /**
   * Create a User Account
   * @param {String} email
   * @param {String} roleType
   * @param {String} uid
   * @returns [User]
   */
  async _createUser({ email, phone, firstname, lastname, country, password }) {
    // creating a new user with firebase information
    const pluginStore = await strapi.store({
      environment: "",
      type: "plugin",
      name: "users-permissions",
    });

    //get strapi settings
    const settings = await pluginStore.get({
      key: "advanced",
    });

    //get strapi default role ID if role ID is not sent in request
    const role = await strapi.query("plugin::users-permissions.role").findOne({
      where: { type: settings.default_role },
    });

    const params = {};
    params.role = role;
    params.email = email;
    params.phone = phone;
    params.firstname = firstname;
    params.lastname = lastname;
    params.country = country;
    params.username = email ? email.split("@")[0] : phone;
    params.confirmed = false;
    params.password = await this.hashPassword(password);

    //create new user
    const user = await strapi.query("plugin::users-permissions.user").create({
      data: params,
      select: this.select,
      populate: this.populate,
    });

    return user;
  },

  /**
   * hashes a password
   * @param {string} password - password to hash
   * @returns {string} hashed password
   */
  async hashPassword(password) {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  },

  async validatePassword(password, hash) {
    const res = await bcrypt.compare(password, hash);
    return res;
  },
  /**
   * LOGIN
   */
  async login(ctx) {
    const { phone, password } = ctx.request.body;

    if (!phone || !password) {
      return ctx.badRequest("Phone and password are required.", {});
    }

    try {
      //check for user with this firebase email
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { phone: phone },
          select: [...this.select, "password"],
          populate: this.populate,
        });

      if (!user) {
        return ctx.badRequest("The credentials you provided are not valid.", {
          code: "invalid-credentials",
        });
      }

      //verify password.
      if (!(await this.validatePassword(password, user.password))) {
        return ctx.badRequest("The credentials you provided are not valid.", {
          code: "invalid-credentials",
        });
      }

      //fetch user's jwt token
      const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      });

      user.id = user.id.toString();
      user.isSubscriber = user.role.type == "subscriber";

      let userData = {
        user: this._sanitizeUser(user),
        jwt,
      };

      //return api response
      ctx.body = {
        data: userData,
      };
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error.code, { code: error.code });
    }
  },

  /**
   *
   * @param {User} user
   */
  _sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email,
      confirmed: user.confirmed,
      blocked: user.blocked,
      phone: user.phone,
      firstname: user.firstname,
      lastname: user.lastname,
      country: user.country,
      role: user.role.type,
    };
  },

  /**
   * Updates a user's fcmtoken in the user profile
   * @param {int} userId
   * @param {string} deviceId
   * @param {string} token
   */
  async updateFcmToken(ctx) {
    const { userId, deviceId, token } = ctx.request.body;

    //get the token record for deviceId
    let tkn = await strapi
      .services("api::fcm-token.fcm-token")
      .findOne({ where: { user: userId, device: deviceId } });

    //update if record for this deviceId exists
    if (tkn) {
      await strapi
        .services("api::fcm-token.fcm-token")
        .update(tkn.id, { token: token });
    } else {
      //create new token record for this deviceId
      await strapi
        .services("api::fcm-token.fcm-token")
        .create({ user: userId, device: deviceId, token: token });
    }

    return;
  },

  async destroyUser(ctx) {
    const { id } = ctx.params;
    if (!id) {
      return ctx.badRequest("User id is required.", {
        code: "user-id-required",
      });
    }
    //get the user record and populations
    let user = await strapi.query("plugin::users-permissions.user").findOne({
      where: { id: id },
      populate: ["user_profile", "vendor_profile"],
    });

    if (!user) {
      return ctx.notFound("User not found.", {
        code: "user-not-found",
      });
    }

    let user_profile = user.user_profile.id;
    let vendor_profile = user.vendor_profile ? user.vendor_profile.id : null;

    //delete user
    await strapi.plugins["users-permissions"].services.user.remove({
      id: user.id,
    });

    //delete user_profile
    await strapi
      .query("api::user-profile.user-profile")
      .delete({ where: { id: user_profile } });

    //delete vendor_profile and relations
    if (vendor_profile) {
      await strapi
        .query("api::vendor-profile.vendor-profile")
        .delete({ where: { id: vendor_profile } });
    }

    //delete events
  },
};
