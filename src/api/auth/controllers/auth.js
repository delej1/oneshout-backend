"use strict";
const { createCoreController } = require("@strapi/strapi").factories;
const bcrypt = require("bcryptjs");
const { sendOTP } = require("../../v1/services/sendchamp");
const tokenCodes = require("referral-codes");
const { isObject } = require("lodash");
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
  generateOTP() {
    return tokenCodes.generate({
      length: 5,
      count: 1,
      charset: "0123456789",
    })[0];
  },
  /**
   * Send OTP
   * @param {*} ctx
   */
  async sendOTP(ctx) {
    const user = ctx.state.user;
    const { phone, firstname, channel } = ctx.request.body;
    const token = this.generateOTP();

    try {
      //save OTP first.
      const result = await strapi
        .query("plugin::users-permissions.user")
        .update({
          where: { id: user.id },
          data: {
            verificationToken: token,
          },
        });

      if (result) {
        const vt = await sendOTP({
          token,
          phone: user.phone,
          channel: channel ?? "sms",
        });

        if (vt && vt.code == 200) return true;

        return core.response({
          code_sent: vt && vt.code == 200 ? true : false,
        });
      } else {
        return ctx.badRequest(
          "Your verification token was not sent. Please try again in a few minutes."
        );
      }
    } catch (error) {
      return ctx.badRequest("There was an error sending your code.");
    }
  },

  async pushOTP({ id, token, phone, channel }) {
    //save OTP first.
    const result = await strapi.query("plugin::users-permissions.user").update({
      where: { id: id },
      data: {
        verificationToken: token,
      },
    });

    if (result) {
      const vt = await sendOTP({ token, phone, channel });
      if (vt && vt.code == 200) return true;
      return false;
    } else {
      return false;
    }
  },

  async verifyOTP(ctx) {
    const user = ctx.state.user;
    const { token } = ctx.request.body;
    console.log(user.verificationToken);
    //get the user.
    if (!user.verificationToken || user.verificationToken != token) {
      return ctx.badRequest("Your verification token is invalid.");
    }

    try {
      const result = await strapi
        .query("plugin::users-permissions.user")
        .update({
          where: { id: user.id },
          data: {
            verificationToken: null,
            confirmed: true,
          },
        });
      return core.response({ valid: result.confirmed });
    } catch (error) {
      return ctx.badRequest("There was an error verifying your code.");
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
    // if (!firstname || !lastname) {
    //   //throw error: token is not found
    //   return ctx.badRequest("First and Last name is required.", {});
    // }
    if (!country) {
      //throw error: token is not found
      return ctx.badRequest("Country is required.", {});
    }
    // if (!email) {
    //   //throw error: token is not found
    //   return ctx.badRequest("Email address is required.", {});
    // }

    try {
      // let cleanPhone = phone.replace("+", "");
      const qp = {
        firstname,
        lastname,
        country,
        phone,
        email,
        password,
      };
      console.log(qp);
      //check for user with phone
      const user_exists = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { phone: qp.phone },
          select: this.select,
          populate: this.populate,
        });

      console.log("user_exists", user_exists);

      if (user_exists) {
        return ctx.badRequest("A user already exists with this phone number.");
      }

      //create user
      user = await this._createUser(qp);

      console.log("user", user);

      if (!user) {
        //user not created successfully
        return ctx.badRequest("User not created successfully");
      }

      //fetch user's jwt token
      jwt = strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      });

      user.id = user.id.toString();
      user.isSubscriber = user.role.type == "subscriber";

      const token = this.generateOTP();
      const code_sent = await this.pushOTP({
        id: user.id,
        token,
        phone,
        channel: "sms",
      });

      let userData = {
        user: this._sanitizeUser(user),
        jwt,
        code_sent: code_sent,
      };

      //return api response
      return core.response(userData);
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
    params.username = phone;
    params.confirmed = false;
    params.password = await this.hashPassword(password);
    params.uid = phone;

    //create new user
    const user = await strapi.query("plugin::users-permissions.user").create({
      data: params,
      select: this.select,
      populate: this.populate,
    });

    // locator.
    if (user) {
      await strapi.query("api::v1.locator").create({ data: { user: user.id } });
    }

    return user;
  },

  async updateProfile(ctx) {
    const user = ctx.state.user;
    const { firstname, lastname, email } = ctx.request.body;

    if (!firstname || !lastname) {
      //throw error: token is not found
      return ctx.badRequest("First and Last names are required.", {});
    }

    if (!email) {
      //throw error: token is not found
      return ctx.badRequest("Email address is required.", {});
    }

    const result = await strapi.query("plugin::users-permissions.user").update({
      where: { id: user.id },
      data: {
        firstname,
        lastname,
        email,
      },
      select: this.select,
      populate: this.populate,
    });

    if (result) {
      const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
        id: result.id,
      });

      result.id = result.id.toString();
      result.isSubscriber = result.role.type == "subscriber";

      let userData = {
        user: this._sanitizeUser(result),
        jwt,
      };

      //return api response
      ctx.body = {
        data: userData,
      };
    } else {
      return ctx.badRequest("Your profile could not be updated.");
    }
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
