module.exports = {
  routes: [
    {
      // Path defined with a URL parameter
      method: "POST",
      path: "/auth/login",
      handler: "auth.login",
    },
    {
      // Path defined with a URL parameter
      method: "POST",
      path: "/auth/register",
      handler: "auth.register",
    },
    {
      // Path defined with a URL parameter
      method: "POST",
      path: "/auth/update",
      handler: "auth.updateProfile",
    },
    {
      // Path defined with a URL parameter
      method: "POST",
      path: "/auth/send-otp",
      handler: "auth.sendOTP",
    },
    {
      // Path defined with a URL parameter
      method: "POST",
      path: "/auth/verify-otp",
      handler: "auth.verifyOTP",
    },
    {
      // Path defined with a URL parameter
      method: "DELETE",
      path: "/auth/destroy/:id",
      handler: "auth.destroyUser",
    },
  ],
};
