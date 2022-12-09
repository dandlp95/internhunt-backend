const router = require("express").Router();
const commentController = require("../controllers/comments");
const { getAuthToken } = require("../middleware/auth");

router.get("/", commentController.getAllComments);

router.get("/getById/:id", commentController.getCommentById);

router.get("/getByPost/:id", commentController.getCommentByPost);

router.get("/getByUser/:id", commentController.getCommentByUser);

router.patch("/edit/:id", getAuthToken, commentController.editComment);

router.patch("/vote/:vote/:id", getAuthToken, commentController.voteComment);

router.delete("/delete/:id", getAuthToken, commentController.deleteComment);

router.post("/add", getAuthToken, commentController.addComment);

module.exports = router;
