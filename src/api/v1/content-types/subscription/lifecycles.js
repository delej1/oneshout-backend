const { ForbiddenError, ApplicationError } = require("@strapi/utils").errors;

module.exports = {
  beforeCreate(event) {
    event.state.users = ["08069606619"];
    const { result, params } = event;

    console.log(params.data.import);

    throw new ApplicationError("Invalid File Upload");
  },
  afterCreate(event) {
    const { result, params } = event;
    console.log(event.state.users);
    console.log(result);
    console.log(params);
  },
};
