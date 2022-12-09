const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  state: {
    type: String,
  },
  company: {
    type: Object, // Object with company name, address, website and other opt contact information.
  },
  type: {
    type: String,
    required: true,
  },
  departments: {
    type: [Schema.Types.ObjectId],
    required: true,
  },
});

const Post = mongoose.model("Post", PostSchema);
module.exports = Post;
