module.exports = ({ strapi }) => ({
  tokenErrors() {
    return ["messaging/invalid-registration-token"];
  },
  async getUserToken({ phone, userId }) {
    if (phone) {
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { phone: phone },
        });
      if (user) {
        return user.user.fcmToken;
      }
      return null;
    } else if (userId) {
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: userId },
        });

      if (user) {
        return user.fcmToken;
      }
      return null;
    }
  },

  defaultMessage: {
    data: {
      type: "general",
      payload: {},
      style: "DEFAULT",
      title: "",
      body: "",
      image: "app_icon",
    },
    notification: { title: "", body: "", image: "" },
  },

  formatMessage(data) {
    data.data.payload = JSON.stringify(data.data.payload);
    // data.data.payload = data.data.payload.toString();
    // data.title = data.notification.title;
    // data.body = data.notification.body;
    // data.image = data.notification.image;
    return {
      data: data.data,
      // notification: data.notification,
    };
  },

  /**
   * Sends the given message via FCM.
   *
   * @param tokens The user(s) tokens in array format.
   * @param data The message data payload.
   * @param priority notification priority.
   * @param hasContent
   * @return A promise fulfilled with a unique message ID
   *   string after the message has been successfully handed off to the FCM
   *   service for delivery.
   */
  async send({ tokens, data, priority = "high", hasContent = true }) {
    // console.log("Sending message to device...");
    console.log(this.formatMessage(data));
    // console.log(tokens);
    // return;
    return await strapi.firebase
      .messaging()
      .sendToDevice(tokens, this.formatMessage(data), {
        contentAvailable: hasContent,
        priority: priority,
      })
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.log("Error sending message:", error);
        return error;
      });
  },

  /**
   * Dry run the tokens via FCM.
   *
   * @param tokens The user(s) tokens in array format.
   * @return A promise fulfilled with a unique message ID
   *   string after the message has been successfully handed off to the FCM
   *   service for delivery.
   */
  async dryRunTokens(tokens) {
    const messages = {
      data: {},
      tokens: tokens,
    };
    console.log("dry running");

    return await strapi.firebase
      .messaging()
      .sendMulticast(messages, true)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.log("Error sending message:", error);
        return error;
      });
  },

  async broadcast({ topic, data = {}, condition }) {
    console.log("Sending broadcast to topic..." + topic);
    var message = {
      data: this.formatMessage(data),
      topic: topic,
      // condition: condition,
    };

    if (condition) {
      message.condition = condition;
    }

    await strapi.firebase
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent broadcast message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
});
