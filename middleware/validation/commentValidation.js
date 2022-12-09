const { body } = require("express-validator");
const UserModel = require("../../models/user");

exports = commentValidation = [
  body("content")
    .isLength({ max: 20000 })
    .withMessage("20000 character limit exceeded."),

  body("owner")
    .custom((ownerId) => {
      return UserModel.findById(ownerId).then((user) => {
        if (!user || user.suspension.isSuspended) {
          return Promise.reject(
            "Invalid Id, owner doesn't exist or is not authorized to make posts." // If there is an error, a rejected promise should be thrown by default
          );
        }
      });
    })
    .withMessage(
      "Invalid Id, owner doesn't exist or is not authorized to make posts."
    ),
    // Add additional validation for the type of post defined.
];
