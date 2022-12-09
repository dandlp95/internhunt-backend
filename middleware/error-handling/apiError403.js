const httpStatusCodes = require("./httpStatusCodes");
const BaseError = require("./baseError");

class Api403Error extends BaseError {
  constructor(
    description,
    name = "Forbidden",
    statusCode = httpStatusCodes.FORBIDDEN,
    isOperational = true
  ) {
    super(name, statusCode, isOperational, description);
  }
}

module.exports = Api403Error;
