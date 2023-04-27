"use strict";
const axios = require("axios");
const appleReceiptVerify = require("node-apple-receipt-verify");

/**
 * subscription controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::v1.subscription", ({ strapi }) => ({
  api: "api::v1.subscription",
  async importSubscribers(data) {
    console.log("dataaza");
    return "buzz";
  },
  async verifyPurchase(ctx) {
    const { data } = ctx.request.body;
    const { store, receipt } = data;
    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    const verificationUrl = process.env.APPLE_PURCHASE_VERIFICATION_URL;

    // // console.log(verificationData);
    const requestData = JSON.stringify({
      "receipt-data": receipt,
      password: sharedSecret, // this is apple shared secret key
      "exclude-old-transactions": true,
    });
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": requestData.length,
    };
    let res = await axios.post(
      "https://buy.itunes.apple.com/verifyReceipt",
      requestData,
      { headers: headers }
    );
    console.log(res.data.status);
    if (res.data.status === 21007) {
      res = await axios.post(
        "https://sandbox.itunes.apple.com/verifyReceipt",
        requestData,
        { headers: headers }
      );
    }
    const latestInfo = res.data?.latest_receipt_info;
    const pendingRenewalInfo = res.data?.pending_renewal_info;
    if (
      !latestInfo ||
      !pendingRenewalInfo ||
      !latestInfo[0] ||
      !pendingRenewalInfo[0]
    ) {
      console.log(
        `{ verificationData: ${receipt}, status: ${res.data?.status}, false, description: no latest_receipt_info or pending_renewal_info }`
      );
      return false;
    }
    const graceMs = pendingRenewalInfo[0].grace_period_expires_date_ms;
    const now = Date.now();
    if (graceMs) {
      const value = now < graceMs;
      console.log(
        `{ verificationData: ${receipt}, ${value}, description: grace period }`
      );
      return value;
    }
    const expiresMs = latestInfo[0].expires_date_ms;
    const value = now < expiresMs;
    console.log(
      `{ verificationData: ${receipt}, ${value}, description: default period (no grace) }`
    );
    return value;
    let buff = new Buffer.from(receipt);
    let base64data = buff.toString("base64");

    // Common initialization, later you can pass options for every request in options
    appleReceiptVerify.config({
      secret: sharedSecret,
      environment: ["sandbox"],
    });

    appleReceiptVerify.validate(
      {
        receipt: base64data,
      },
      (err, products) => {
        if (err) {
          return console.error(err);
        }
        console.log(products);
        // ok!
      }
    );
    return;

    // Callback version
    let products = [];
    try {
      products = await appleReceiptVerify.validate({
        receipt: receipt,
      });
      console.log("products", products);
      // todo
    } catch (e) {
      if (e instanceof appleReceiptVerify.EmptyError) {
        // todo
        console.log(e);
        return e;
      } else if (e instanceof appleReceiptVerify.ServiceUnavailableError) {
        // todo
        console.log(e);
        return e;
      } else {
        console.log(e);
        return e;
      }
    }

    return products;
    const axiosOption = {
      method: "POST",
      url: verificationUrl,
      headers: {
        accept: "application/json",
        //   "content-type": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    console.log(receipt);

    try {
      await axios
        .request({
          ...axiosOption,
          data: JSON.stringify({
            password: sharedSecret,
            "receipt-data": receipt,
            "exclude-old-transactions": false,
          }),
        })
        .then(function (response) {
          console.log("response.data", response.data);
          return response.data;
        })
        .catch(function (error) {
          console.log(error.response);
        });
    } catch (error) {
      return ctx.badRequest(error);
    }
  },
}));
