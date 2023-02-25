const { parseMultipartData } = require("@strapi/utils");

const parseBody = (ctx) => {
  if (ctx.is("multipart")) {
    return parseMultipartData(ctx);
  }

  const { data } = ctx.request.body || {};

  return { data };
};

const error = (code, msg) => {
  return { msg, code };
};

const formatError = (error, ctx) => {
  switch (error.code) {
    case 400:
      return ctx.badRequest(error.msg);
    default:
      return ctx.internalServerError(error.msg);
  }
};

module.exports = {
  parseBody,
  error,
  formatError,
};
