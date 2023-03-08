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
        android_channel_id: "d9017750-d5ed-4b14-b6d2-4a35e6fc75d3",
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
      // console.log(response.data);
      return response.data;
    })
    .catch(function (error) {
      console.error(error.response.data);
      return error.response.data;
    });
};

const sendLocatorRequestNotification = ({
  phone,
  message,
  userName,
  userPhone,
}) => {
  const { options } = init();
  let data = options.data;
  return axios
    .request({
      ...options,
      data: {
        ...data,
        android_channel_id: "f8ed722c-abfa-4afa-b080-4cb5592faa47",
        android_group: "910",
        thread_id: "910",
        name: "LOCATOR_NOTIFICATION",
        include_external_user_ids: [...phone],
        contents: { en: message },
        buttons: [
          {
            id: "share-location",
            text: "Share Location",
            icon: "ic_menu_share",
          },
          { id: "cancel", text: "Cancel", icon: "" },
        ],
        data: { userName, userPhone },
      },
    })
    .then(function (response) {
      // console.log(response.data);
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
        android_channel_id: "d9017750-d5ed-4b14-b6d2-4a35e6fc75d3",
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
      // console.log(response.data);
      return response.data;
    })
    .catch(function (error) {
      console.error(error.response.data);
      return error.response.data;
    });
};

module.exports = {
  sendShoutNotification,
  cancelShoutNotification,
  sendLocatorRequestNotification,
};
