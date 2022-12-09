const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VotingHistoryCommentSchema = new Schema({
  voter: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
  },
  lastVote: Number,
});

const VotingHistoryComment = mongoose.model(
  "VotingHistoryComment",
  VotingHistoryCommentSchema
);

module.exports = VotingHistoryComment;