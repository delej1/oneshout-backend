const Sendchamp = require("sendchamp-sdk");
const axios = require("axios");

const sendchamp = new Sendchamp({
  mode: process.env.NODE_ENV !== "production" ? "test" : "live",
  publicKey: process.env.SEND_CHAMP_PUBLIC_KEY,
});

/**
 * Initializes sendchamp package.
 * @returns
 */
const init = () => {
  const sendchamp = new Sendchamp({
    mode: process.env.NODE_ENV !== "production" ? "test" : "live",
    publicKey: process.env.SENDCHAMP_PUBLIC_KEY,
  });

  const axiosOption = {
    method: "POST",
    url: "https://api.sendchamp.com/api/v1/verification/create",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: "Bearer " + process.env.SENDCHAMP_PUBLIC_KEY,
    },
  };

  return { axiosOption, sendchamp };
};

const sendOTP = async ({ token, phone, firstname, channel }) => {
  const { axiosOption } = init();

  return await axios
    .request({
      ...axiosOption,
      data: {
        channel: channel,
        sender: "Sendchamp",
        customer_mobile_number: phone,
        token_type: "numeric",
        token_length: 6,
        expiration_time: 30,
        meta_data: { first_name: firstname },
        token: token,
      },
    })
    .then(function (response) {
      // console.log("response.data", response.data);
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response);
    });
};

module.exports = { sendOTP };
