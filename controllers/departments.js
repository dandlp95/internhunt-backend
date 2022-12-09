const Department = require("../models/department");
const controllers = require("./genericControllers");

const getAll = controllers.getAll(Department);

const getById = controllers.getById(Department);

module.exports = { getAll, getById };
