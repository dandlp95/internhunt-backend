const ApiError404 = require("../middleware/error-handling/apiError404");
const ApiError401 = require("../middleware/error-handling/apiError401");
const ApiError400 = require("../middleware/error-handling/apiError400");
const ApiError422 = require("../middleware/error-handling/apiError422");
const controllers = require("./genericControllers");
const MajorModel = require("../models/major");
const UserModel = require("../models/user");

const getMajors = controllers.getAll(MajorModel);

const getMajor = controllers.getById(MajorModel);

const getMajorByDepartment = async (req, res, next) => {
  MajorModel.find({ department: req.params.department }, (err, docs) => {
    if (err) {
      next(new ApiError400(err.message));
    } else {
      res.status(200).send(docs);
    }
  });
};

const addMajor = async (req, res, next) => {
  try {
    const apiAuthError = new ApiError401("Unauthorized");
    if (!req.accountId) throw apiAuthError;

    const userDoc = await UserModel.findById(req.accountId);
    if (!userDoc || userDoc.accessLevel != 1) throw apiAuthError;

    const newMajor = {
      name: req.body.name,
    };

    MajorModel.create(newMajor, (err, doc) => {
      if (err) {
        next(new ApiError400(err.message));
      } else {
        res.status(200).send(doc);
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMajors,
  getMajor,
  getMajorByDepartment,
  addMajor,
};
