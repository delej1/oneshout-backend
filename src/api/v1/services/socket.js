"use strict";

module.exports = {
  async initSocket() {
    // strapi.server.httpServer is the new update for Strapi V4
    var io = require("socket.io")(strapi.server.httpServer, {
      cors: {
        // cors setup
        origin: "*", // "http://localhost:1400",
        methods: ["GET", "POST"],
        // allowedHeaders: ["my-custom-header"],
        // credentials: true,
      },
      noServer: true,
    });

    io.on("connection", function (socket) {
      const query = socket.handshake.query;
      console.log("Connect", query);

      socket.on("position-change", async (data) => {
        const d = JSON.parse(data);
        console.log(d);
        // let x = await strapi.query("api::shout.shout").findMany();
        // console.log(x);
        io.emit(d.channel, data);
      });

      socket.on("disconnect", () => {});

      //Listening for a connection from the frontend
      socket.on("join", ({ channel }) => {
        // Listening for a join connection
        console.log("helper connected");
        if (channel) {
          socket.join(channel); // Adding the user to the group
          socket.emit(channel, "Welcome herer");
          console.log("channel is", channel.trim());
        } else {
          console.log("An error occurred: No channel to join.");
        }
      });
      socket.on("help", ({ username }) => {
        // Listening for a join connection
        console.log("user connected");
        console.log("username is ", username);
        if (username) {
          const room = `help_${username}`;
          socket.join(room); // Adding the user to the group
          socket.emit(room, "welcome, someone will see your shout.");
          socket.broadcast.to(room).emit("message", {
            //Sending the message to the group
            user: "data.username",
            text: "data.message",
          });
          console.log("shouted");
        } else {
          console.log("An error occurred");
        }
      });

      socket.on("helpLocation", ({ location, room }) => {
        // Listening for a join connection

        console.log("room is", room);
        console.log("location is", location);
        if (room) {
          socket.emit(room, location);

          console.log("location shouted");
        } else {
          console.log("An error occurred");
        }
      });

      socket.on("sendMessage", async (data) => {
        // Listening for a sendMessage connection
        let strapiData = {
          // Generating the message data to be stored in Strapi
          data: {
            user: data.user,
            message: data.message,
          },
        };
        var axios = require("axios");
        await axios
          .post("http://localhost:1400/api/messages", strapiData) //Storing the messages in Strapi
          .then((e) => {
            socket.broadcast.to("group").emit("message", {
              //Sending the message to the group
              user: data.username,
              text: data.message,
            });
          })
          .catch((e) => console.log("error", e.message));
      });
    });
  },
};
