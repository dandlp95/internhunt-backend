const { body } = require("express-validator");
const UserModel = require("../../models/user");

exports = userValidation = [
  body("email").isEmail().withMessage("Enter a valid email"),
  // Check if email is a byui email format
  body("firstName")
];
