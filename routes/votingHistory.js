const router = require("express").Router();
const votingHistoryController = require("../controllers/votingHistory");
const { getAuthToken } = require("../middleware/auth");

router.get(
  "/getById/:id",
  getAuthToken,
  votingHistoryController.getVotingHistoryByIds
);

router.get(
  "/getById/comment/:id",
  getAuthToken,
  votingHistoryController.getVotingHistoryCommentByIds
);
module.exports = router;
