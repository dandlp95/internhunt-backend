const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  accessLevel: {
    type: Number,
    default: 0,
  },
  verificationCode: {
    type: Number,
    default: null,
  },
  suspension: {
    isSuspended: {
      type: Boolean,
      default: false,
    },
    expire: {
      type: Date,
      default: null,
    },
  },
  warnings: [
    {
      userViolation: {
        type: {},
      },
      warningText: String,
      issued: Date,
      expiration: Date,
    },
  ],
  active: {
    type: Boolean, 
    default: true, 
  },
  major: {
    type: Schema.Types.ObjectId,
    ref: "Major",
  },
  profilePicture: {
    type: String,
    default: null,
  },
  accountCreationDate: {
    type: Date,
    default: new Date(),
  },
  gmailLogin: {
    type: Boolean,
    default: false
  },
  customPassword: {
    type: Boolean,
    default: true
  }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
