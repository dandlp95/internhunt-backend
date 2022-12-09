const router = require("express").Router()
const controller = require("../controllers/majorimages");

router.get("/", controller.getAllMajorImages)

router.get("/:id", controller.getMajorImageById)

router.get("/getByMajor/:id", controller.getMajorImageByMajor)

module.exports = router;