// api404Error.js
const httpStatusCodes = require("./httpStatusCodes");
const BaseError = require("./baseError");

class Api422Error extends BaseError {
  constructor(
    description,
    name = "Unprocessable entity.",
    statusCode = httpStatusCodes.UNPROCESSABLE_ENTITY,
    isOperational = true
  ) {
    super(name, statusCode, isOperational, description);
  }
}

module.exports = Api422Error;
