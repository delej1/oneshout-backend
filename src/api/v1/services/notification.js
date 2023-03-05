const OneSignal = require("@onesignal/node-onesignal");
const axios = require("axios");

const init = () => {
  const options = {
    method: "POST",
    url: "https://onesignal.com/api/v1/notifications",
    headers: {
      accept: "application/json",
      Authorization: "Basic " + process.env.ONE_SIGNAL_API_KEY,
      "content-type": "application/json",
    },
    data: { app_id: process.env.ONE_SIGNAL_APP_ID },
  };
  return { options };
};
const sendShoutNotification = ({
  recipients,
  message,
  shoutId,
  longitude,
  latitude,
}) => {
  const { options } = init();
  let data = options.data;
  return axios
    .request({
      ...options,
      data: {
        ...data,
        android_channel_id: "baee5bcd-0f22-4c4f-8c98-e80436559e9d",
        android_group: "911",
        thread_id: "911",
        android_group_message: { en: "You have $[notif_count] new shouts" },
        summary_arg: { en: "You have $[notif_count] new shouts" },
        name: "SHOUT_NOTIFICATION",
        include_external_user_ids: recipients,
        contents: { en: message },
        buttons: [
          { id: "view-location", text: "View Location", icon: "ic_menu_share" },
        ],
        data: { shoutId, longitude, latitude },
      },
    })
    .then(function (response) {
      console.log(response.data);
      return response.data;
    })
    .catch(function (error) {
      console.error(error.response.data);
      return error.response.data;
    });
};

const cancelShoutNotification = ({
  recipients,
  message,
  shoutId,
  longitude,
  latitude,
}) => {
  const { options } = init();
  let data = options.data;
  return axios
    .request({
      ...options,
      data: {
        ...data,
        android_channel_id: "5dac8b53-6f96-41a6-8d6b-2c3d0f0467b6",
        android_group: "911",
        thread_id: "911",
        // android_group_message: { en: "You have $[notif_count] new shouts" },
        // summary_arg: { en: "You have $[notif_count] new shouts" },
        name: "SHOUT_CANCEL_NOTIFICATION",
        include_external_user_ids: recipients,
        contents: { en: message },

        data: { shoutId, longitude, latitude },
      },
    })
    .then(function (response) {
      console.log(response.data);
      return response.data;
    })
    .catch(function (error) {
      console.error(error.response.data);
      return error.response.data;
    });
};

module.exports = { sendShoutNotification, cancelShoutNotification };
