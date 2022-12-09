const router = require("express").Router();
const controller = require("../controllers/majors");
const { getAuthToken } = require("../middleware/auth");

router.get("/", controller.getMajors);

router.get("/:id", controller.getMajor);

router.post("/add", getAuthToken, controller.addMajor);

router.get("/getByDepartment/:department", controller.getMajorByDepartment);

module.exports = router;
