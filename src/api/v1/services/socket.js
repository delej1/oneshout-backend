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
      console.log("Connection Query: ", query);

      socket.on("position-change", async (data, callback) => {
        const d = JSON.parse(data);
        // console.log(d);

        const sockets = await io.in(d.channel).fetchSockets();

        io.emit(d.channel, JSON.stringify(data));
        if (callback) callback(sockets.length);
        // socket.emit("location-sent", sockets.length);
        //post the new location.
        await strapi
          .service("api::v1.shout-location")
          .saveLocationChange({ id: d.shoutId, lng: d.lng, lat: d.lat });
        // console.log(x);
      });

      socket.on("disconnect", () => {});

      //Listening for a connection from the frontend
      socket.on("join", async ({ channel }, callback) => {
        // Listening for a join connection
        console.log("helper connected on " + query.channel);
        if (channel) {
          socket.join(channel); // Adding the user to the group

          //get the shouts
          const locations = await strapi
            .service("api::v1.shout-location")
            .getLocations({ id: query.shoutId });
          //return callback
          console.log(locations);
          console.log(callback);
          socket.emit("joined", JSON.stringify(locations));
          if (callback) callback(JSON.stringify(locations));
        }
      });

      socket.on("help", ({ channel }) => {
        // Listening for a join connection
        console.log("* shouter connected *");
        console.log("shouter's channel is ", channel);
        if (channel) {
          // socket.join(channel); // Adding the user to the group
          socket.emit(channel, "welcome, someone will see your shout.");
          socket.broadcast.to(channel).emit("message", {
            //Sending the message to the group
            user: "data.username",
            text: "data.message",
          });
          console.log("shout successful");
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
