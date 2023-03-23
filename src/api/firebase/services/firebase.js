module.exports = ({ strapi }) => ({
  tokenErrors() {
    return [
      "messaging/invalid-registration-token",
      "messaging/registration-token-not-registered",
    ];
  },
  async deleteBadTokens(response, tokens) {
    if (response && response.failureCount > 0) {
      //run through the result to find the failures
      for (const [key, result] of Object.entries(response.responses)) {
        console.log(result);
        //if result.error is not null, then its an error
        if (result.error != null) {
          //get the error code
          const code = result.error["errorInfo"].code;
          console.log(code);
          //If this is a token error, then delete the token from database.
          if (this.tokenErrors().includes(code)) {
            await strapi
              .service("api::v1.user-fcm-token")
              .deleteBadToken(tokens[key]);
          }
        }
      }
    }
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

  defaultMessage() {
    return {
      data: {
        type: "general",
        payload: {},
        style: "DEFAULT",
        title: "",
        body: "",
        image: "app_icon",
      },
      notification: { title: "", body: "", image: "" },
      android: {
        notification: {
          icon: "ic_notification_icon",
          color: "#f45342",
          sound: "alarm.mp3",
          channelId: "com.ebs.shout.default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };
  },

  formatMessage(msg) {
    msg.data.payload = JSON.stringify(msg.data.payload);
    // data.data.payload = data.data.payload.toString();
    msg.notification.title = msg.data.title;
    msg.notification.body = msg.data.body;
    // data.body = data.notification.body;
    // data.image = data.notification.image;
    console.log(msg.apns);
    return {
      ...msg,
      // data: data.data,
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
    // return;
    return await strapi.firebase
      .messaging()
      .sendMulticast(
        { tokens: tokens, ...this.formatMessage(data) }
        // {
        //   contentAvailable: hasContent,
        //   priority: priority,
        // }
      )
      .then((response) => {
        // console.log(response);
        this.deleteBadTokens(response, tokens);
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
