module.exports = {
  routes: [
    {
      method: "POST",
      path: "/firebase/push-notification",
      handler: "firebase.sendFcm",
    },
    {
      method: "POST",
      path: "/firebase/update-token",
      handler: "firebase.updateFcmToken",
    },
  ],
};
