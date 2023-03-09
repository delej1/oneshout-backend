"use strict";
const utils = require("../src/utils/index");
const socket = require("../src/api/v1/services/socket");
const admin = require("firebase-admin");
module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    // admin.initializeApp({
    //   credential: admin.credential.cert({
    //     projectId: process.env.FIREBASE_PROJECT_ID.toString(),
    //     clientEmail: process.env.FIREBASE_CLIENT_EMAIL.toString(),
    //     privateKey: process.env.FIREBASE_PRIVATE_KEY.toString(),
    //   }),
    //   projectId: process.env.FIREBASE_PROJECT_ID.toString(),
    // });

    // strapi.firebase = admin;

    core.utils = { ...core.utils, ...utils };
    //initialize socket connection
    socket.initSocket();
  },
};
