const PostModel = require("../models/post");
const MajorModel = require("../models/major");
const UserModel = require("../models/user");
const ApiError404 = require("../middleware/error-handling/apiError404");
const ApiError401 = require("../middleware/error-handling/apiError401");
const ApiError400 = require("../middleware/error-handling/apiError400");
const controllers = require("./genericControllers");
const Api404Error = require("../middleware/error-handling/apiError404");
const { default: mongoose } = require("mongoose");
const VotingHistory = require("../models/votingHistory");

const apiAuthError = new ApiError401("Unathorized.");

const getPostById = controllers.getById(PostModel);

const votePost = controllers.voteModel(PostModel, VotingHistory);

const editPost = async (req, res, next) => {
  try {
    if (!req.accountId) throw apiAuthError;

    edit = {
      title: req.body.title,
      content: req.body.content,
      city: req.body.city,
      company: req.body.company,
      type: req.body.type,
    };
    const userId = mongoose.Types.ObjectId(req.accountId);

    PostModel.findOneAndUpdate(
      { _id: req.params.id, owner: userId },
      edit,
      { new: true },
      (err, doc) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!doc) {
          next(new Api404Error("No post found"));
        } else {
          res.status(200).send(doc);
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    if (!req.accountId) throw apiAuthError;

    const user = await UserModel.findById(req.accountId);
    if (user.accessLevel === 1) {
      PostModel.findOneAndDelete({ _id: req.params.id }, (err, doc) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!doc) {
          next(new Api404Error("No post found."));
        } else {
          res.status(200).send(doc);
        }
      });
    } else {
      PostModel.findOneAndDelete(
        { _id: req.params.id, owner: req.accountId },
        (err, doc) => {
          if (err) {
            next(new ApiError400(err.message));
          } else if (!doc) {
            next(new Api404Error("No document found"));
          } else {
            res.status(200).send(doc);
          }
        }
      );
    }
  } catch (err) {
    next(err);
  }
};

const addPost = async (req, res, next) => {
  try {
    if (!req.accountId || req.accountId != req.body.owner) {
      throw apiAuthError;
    }

    const majors = req.body.majors;
    const departments = await Promise.all(
      majors.map(async (major) => {
        const majorDoc = await MajorModel.findOne({ name: major });
        if (majorDoc) {
          return majorDoc.department;
        }
      })
    );

    if (!departments) {
      throw new ApiError404("No departments found.");
    }

    const post = {
      title: req.body.title,
      content: req.body.content,
      owner: req.body.owner,
      state: req.body.state,
      company: req.body.company,
      type: req.body.type,
      departments: departments,
      date: new Date()
    };
    PostModel.create(post, (err, doc) => {
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

const getPostByUser = async (req, res, next) => {
  PostModel.find({ owner: req.params.id }, async (err, docs) => {
    if (err) {
      next(new ApiError400(err.message));
    } else if (!docs) {
      next(new ApiError404("No posts found."));
    } else {
      await PostModel.populate(docs, "owner");
      res.status(200).send(docs);
    }
  });
};

const getPostsByDepartment = (req, res, next) => {
  const department = req.body.department;
  PostModel.find({ departments: department }, (err, docs) => {
    if (err) {
      next(new ApiError400(err.message));
    } else if (!docs) {
      next(new ApiError404("No posts found."));
    } else {
      res.status(200).send(docs);
    }
  });
};

const getPostsCount = async (req, res, next) => {
  let postType = req.query.type;
  let search = req.query.search;
  let sortByParam = req.query.sort;

  if (!sortByParam || sortByParam == "null" || sortByParam == "date") {
    sortByParam = { date: -1 };
  } else if (sortByParam == "rating") {
    sortByParam = { rating: -1 };
  } else {
    sortByParam = { date: -1 };
  }

  let QString;
  if (search != "null" && search != null) {
    QString = search.split(" ").map((string) => new RegExp(string, "i"));
  } else {
    search = "";
    QString = search.split(" ").map((string) => new RegExp(string));
  }

  let PTypeString;
  if (postType != "null" && postType != null) {
    PTypeString = postType.split(" ").map((string) => new RegExp(string, "i"));
  } else {
    postType = "";
    PTypeString = postType.split(" ").map((string) => new RegExp(string));
  }

  const major = req.query.major;
  var queryMajor = false;
  let department;

  if (major != "null" && major != null) {
    const foundMajor = await MajorModel.findOne({ name: major });
    if (foundMajor) {
      department = foundMajor.department;
      queryMajor = true;
    } else {
      next(new ApiError400("Major does not exist."));
    }
  } else {
    queryMajor = false;
  }

  if (queryMajor) {
    PostModel.find({
      $and: [
        { $or: [{ title: { $in: QString } }, { content: { $in: QString } }] },
        { departments: department },
        { type: { $in: PTypeString } },
      ],
    })
      .count()
      .exec((err, count) => {
        if (err) {
          next(new ApiError400(err.message));
        } else {
          res.status(200).send({ count });
        }
      });
  } else {
    PostModel.find({
      $and: [
        { $or: [{ title: { $in: QString } }, { content: { $in: QString } }] },
        { type: { $in: PTypeString } },
      ],
    })
      .count()
      .exec((err, count) => {
        if (err) {
          next(new ApiError400(err.message));
        } else {
          res.status(200).send({ count });
        }
      });
  }
};

const getPosts = async (req, res, next) => {
  let postType = req.query.type;
  let search = req.query.search;
  let sortByParam = req.query.sort;

  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const pageNumber = req.query.page ? parseInt(req.query.page) : 1;

  if (!sortByParam || sortByParam == "null" || sortByParam == "date") {
    sortByParam = { date: -1 };
  } else if (sortByParam == "rating") {
    sortByParam = { rating: -1 };
  } else {
    sortByParam = { date: -1 };
  }

  let QString;
  if (search != "null" && search != null) {
    QString = search.split(" ").map((string) => new RegExp(string, "i"));
  } else {
    search = "";
    QString = search.split(" ").map((string) => new RegExp(string));
  }

  let PTypeString;
  if (postType != "null" && postType != null) {
    PTypeString = postType.split(" ").map((string) => new RegExp(string, "i"));
  } else {
    postType = "";
    PTypeString = postType.split(" ").map((string) => new RegExp(string));
  }

  const major = req.query.major;
  var queryMajor = false;
  let department;

  if (major != "null" && major != null) {
    const foundMajor = await MajorModel.findOne({ name: major });
    if (foundMajor) {
      department = foundMajor.department;
      queryMajor = true;
    } else {
      next(new ApiError400("Major does not exist."));
    }
  } else {
    queryMajor = false;
  }

  if (queryMajor) {
    PostModel.find({
      $and: [
        { $or: [{ title: { $in: QString } }, { content: { $in: QString } }] },
        { departments: department },
        { type: { $in: PTypeString } },
      ],
    })
      .populate("owner", "firstName lastName")
      .skip((pageNumber - 1) * pagination)
      .limit(pagination)
      .sort(sortByParam)
      .exec((err, docs) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!docs) {
          next(new ApiError404("No posts found"));
        } else {
          res.status(200).send(docs);
        }
      });
  } else {
    PostModel.find({
      $and: [
        { $or: [{ title: { $in: QString } }, { content: { $in: QString } }] },
        { type: { $in: PTypeString } },
      ],
    })
      .populate("owner", "lastName")
      .skip((pageNumber - 1) * pagination)
      .limit(pagination)
      .sort(sortByParam)
      .exec((err, docs) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!docs) {
          next(new ApiError404("No posts found"));
        } else {
          res.status(200).send(docs);
        }
      });
  }
};

module.exports = {
  getPostById,
  editPost,
  deletePost,
  addPost,
  getPostByUser,
  getPostsByDepartment,
  getPosts,
  votePost,
  getPostsCount,
};
