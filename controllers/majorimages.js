const MajorImage = require("../models/majorImage");
const controllers = require("./genericControllers");
const ApiError400 = require("../middleware/error-handling/apiError400");
const ApiError404 = require("../middleware/error-handling/apiError404");
const mongoose = require("mongoose");

const getAllMajorImages = controllers.getAll(MajorImage);

const getMajorImageById = controllers.getById(MajorImage);

const getMajorImageByMajor = (req, res, next) => {
  const id = mongoose.Types.ObjectId(req.params.id);
  MajorImage.findOne({ major: id }, (err, doc) => {
    if (err) {
      next(new ApiError400(err.message));
    } else if (!doc) {
      next(new ApiError404("No image found"));
    } else {
      res.status(200).send(doc);
    }
  });
};

module.exports = { getAllMajorImages, getMajorImageById, getMajorImageByMajor };
