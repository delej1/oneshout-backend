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
      method: "POST",
      path: "/auth/send-forgot-password-otp",
      handler: "auth.sendForgotPasswordOTP",
    },
    {
      // Path defined with a URL parameter
      method: "POST",
      path: "/auth/verify-password-reset-otp",
      handler: "auth.verifyPasswordResetOTP",
    },
    {
      // Path defined with a URL parameter
      method: "POST",
      path: "/auth/change-password",
      handler: "auth.changePassword",
    },
    {
      // Path defined with a URL parameter
      method: "DELETE",
      path: "/auth/destroy/:id",
      handler: "auth.destroyUser",
    },
  ],
};
