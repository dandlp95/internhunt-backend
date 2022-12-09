const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MajorSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: Schema.Types.ObjectId,
    ref: "MajorImage",
    required: true,
  }
});

const Major = mongoose.model("Major", MajorSchema);
module.exports = Major;
