module.exports = ({ env }) => ({
  "vs-core": {
    // enabled: true,
    // resolve: "./src/plugins/vs-core" ,
    config: {},
  },
  //   io: {
  //     enabled: true,
  //     config: {
  //       IOServerOptions: {
  //         cors: { origin: env(URL), methods: ["GET"] },
  //       },
  //       contentTypes: {
  //         message: "*",
  //         chat: ["create"],
  //       },
  //       events: [
  //         {
  //           name: "connection",
  //           handler: ({ strapi }, socket) => {
  //             strapi.log.info(`[io] new connection with id ${socket.id}`);
  //           },
  //         },
  //       ],
  //     },
  //   },
});
