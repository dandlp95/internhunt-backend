const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MarjorImageSchema = new Schema({
  img: {
    type: String,
    required: true,
  },
  alt: {
    type:String,
    required: true,
  },
  major: {
    type: Schema.Types.ObjectId,
    ref: "Major"
  }
});

const MajorImage = mongoose.model("MajorImage", MarjorImageSchema);
module.exports = MajorImage;