const router = require("express").Router();
const controllers = require("../controllers/departments");

router.get("/", controllers.getAll);

router.get("/getById/:id", controllers.getById);

module.exports = router;
