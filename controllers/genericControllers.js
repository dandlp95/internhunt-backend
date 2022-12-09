const ApiError404 = require("../middleware/error-handling/apiError404");
const ApiError400 = require("../middleware/error-handling/apiError400");
const ApiError422 = require("../middleware/error-handling/apiError422");
const ApiError401 = require("../middleware/error-handling/apiError401");

const apiAuthError = new ApiError401();

const getAll = (Schema) => {
  return (req, res, next) => {
    Schema.find({}, (err, docs) => {
      if (err) {
        next(new ApiError400(err.message));
      } else if (!docs) {
        next(new ApiError404("No documents found"));
      } else {
        res.status(200).send(docs);
      }
    });
  };
};

const getById = (Schema) => {
  return (req, res, next) => {
    Schema.findById(req.params.id, (err, doc) => {
      if (err) {
        const apiError = new ApiError400(err.message);
        next(apiError);
      } else if (!doc) {
        next(new ApiError404("no document found"));
      } else {
        res.status(200).send(doc);
      }
    });
  };
};

const voteModel = (Schema, Schema2) => {
  return async (req, res, next) => {
    try {
      if (!req.accountId) throw apiAuthError;
      
      var addVote = false;
      var vote;

      var userVotingHistory = await Schema2.findOne({
        voter: req.accountId,
        post: req.params.id,
      });

      if (!userVotingHistory) {
        userVotingHistory = new Schema2({
          voter: req.accountId,
          post: req.params.id,
          lastVote: 0,
        });
      }

      const lastVote = userVotingHistory.lastVote;
      const userVote = req.params.vote;

      if (lastVote < 1 && userVote == "upvote") {
        addVote = true;
        vote = 1;
      } else if (lastVote < 2 && lastVote > -1 && userVote == "downvote") {
        addVote = true;
        vote = -1;
      }

      if (addVote) {
        Schema.findByIdAndUpdate(
          req.params.id,
          { $inc: { rating: vote } },
          { new: true },
          (err, doc) => {
            if (err) {
              throw new ApiError400(err.message);
            } else {
              userVotingHistory.lastVote = lastVote + vote;
              userVotingHistory.save();
              res.status(200).send(doc);
            }
          }
        );
      } else {
        throw new ApiError400("Invalid vote.");
      }
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  getAll,
  getById,
  voteModel,
};
