const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VotingHistorySchema = new Schema({
  voter: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
  },
  lastVote: Number,
});

const VotingHistory = mongoose.model("VotingHistory", VotingHistorySchema);
module.exports = VotingHistory;
