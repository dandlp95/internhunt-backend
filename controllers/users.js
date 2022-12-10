const UserModel = require("../models/user");
const MajorModel = require("../models/major");
const ApiError404 = require("../middleware/error-handling/apiError404");
const ApiError401 = require("../middleware/error-handling/apiError401");
const ApiError400 = require("../middleware/error-handling/apiError400");
const ApiError422 = require("../middleware/error-handling/apiError422");
const ApiError403 = require("../middleware/error-handling/apiError403");
const { encryptPassword } = require("../utils/encrypt");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { emailClient } = require("../utils/emailClient");
const Api401Error = require("../middleware/error-handling/apiError401");
const mongoose = require("mongoose");
const axios = require("axios");

const authError = new ApiError401("Not authorized.");
const forbidden = new ApiError403(
  "Authorization not sufficient to perform operation"
);

const getAllUsers = (req, res, next) => {
  UserModel.find({}, "firstName lastName", (err, docs) => {
    if (err) {
      next(new ApiError400(err.message));
    } else if (!docs) {
      next(new ApiError404("No doc found"));
    } else {
      res.status(200).send(docs);
    }
  });
};

const getUserById = (req, res, next) => {
  UserModel.findById(
    req.params.id,
    "firstName lastName major accessLevel",
    async (err, doc) => {
      if (err) {
        next(new ApiError400(err.message));
      } else if (!doc) {
        next(new ApiError404("No doc found"));
      } else {
        res.status(200).send(await doc.populate("major"));
      }
    }
  );
};

const getAllUsersPrivate = async (req, res, next) => {
  try {
    if (!req.accountId) throw authError;
    const user = await UserModel.findById(req.accountId);
    if (!user || user.accessLevel != 1) throw forbidden;

    UserModel.find(
      {},
      "firstName lastName email accessLevel suspension warnings",
      (err, doc) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!doc) {
          next(new ApiError404("No user found"));
        } else {
          res.status(200).send(doc);
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const getUserByIdPrivate = async (req, res, next) => {
  try {
    if (!req.accountId && req.accountId != req.params.id) throw authError;
    const user = await UserModel.findById(req.accountId);
    if (!user && user.accessLevel != 1) throw forbidden;

    UserModel.findById(
      req.params.id,
      "major firstName lastName email accessLevel suspension warnings active",
      async (err, doc) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!doc) {
          next(new ApiError404("No user found"));
        } else {
          res.status(200).send(await doc.populate("major"));
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const editUser = async (req, res, next) => {
  try {
    if (!req.accountId) throw authError;
    if (req.accountId != req.params.id) throw forbidden;
    const major = await MajorModel.findOne({ name: req.body.major });
    if (!major) throw new ApiError400("Not a valid major.");

    const edits = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      major: mongoose.Types.ObjectId(major._id),
    };

    UserModel.findByIdAndUpdate(
      req.params.id,
      edits,
      { new: true },
      (err, doc) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!doc) {
          next(new ApiError404("No doc found"));
        } else {
          const newUserInfo = {
            firstName: doc.firstName,
            lastName: doc.lastName,
            major: major.name,
          };
          res.status(200).send(newUserInfo);
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const deleteUser = (req, res, next) => {
  try {
    if (!req.accountId) throw authError;
    if (req.accountId != req.params.id) throw forbidden;

    UserModel.findByIdAndDelete(req.params.id, (err, doc) => {
      if (err) {
        next(new ApiError400(err.message));
      } else if (!doc) {
        next(new ApiError404("No user found"));
      } else {
        res.status(200).send({ message: "user deleted." });
      }
    });
  } catch (err) {
    next(err);
  }
};

const addUser = async (req, res, next) => {
  try {
    const encryptedPassword = await encryptPassword(req.body.password);
    const major = await MajorModel.findOne({ name: req.body.major });

    if (!major) throw new ApiError400("Invalid major");

    const majorId = major._id;

    const newUser = {
      email: req.body.email,
      password: encryptedPassword,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      major: majorId,
    };

    UserModel.create(newUser, (err, doc) => {
      if (err) {
        next(new ApiError400(err.message));
      } else {
        const token = jwt.sign(
          { email: req.body.email, id: doc._id },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "1h" }
        );
        res
          .status(200)
          .send({ token: token, userId: doc._id, major: major.name });
      }
    });
  } catch (err) {
    next(err);
  }
};

const warnUser = async (req, res, next) => {
  try {
    if (!req.accountId) throw authError;

    const admin = await UserModel.findById(req.accountId);
    if (!admin || admin.accessLevel != 1) throw authError;

    const user = await UserModel.findById(req.params.id);

    if (!user) throw new ApiError404("No user found.");

    const warning = {
      warningText: req.body.warningText,
      date: req.body.date,
    };

    user.warnings.push(warning);

    if (user.warnings.length >= 3) {
      const d = new Date();
      d.setDate(d.getDate() + 14);

      const suspension = {
        isSuspended: true,
        expire: d,
      };

      user.suspension = suspension;

      await user.save(); // If doc doesn't exist, mongoose throws doc not found err.

      doc.status(200).send({ message: "success" });
    }
  } catch (err) {
    next(err);
  }
};

const banHandler = async (req, res, next) => {
  try {
    if (!req.accountId) throw authError;
    const admin = await UserModel.findById(req.accountId);

    if (!admin || admin.accessLevel != 1) throw forbidden;

    var ban;
    if (req.params.action === "true") {
      ban = true;
    } else if (req.params.action === "false") {
      ban = false;
    } else {
      throw new ApiError400("Invalid param");
    }

    UserModel.findOneAndUpdate(
      { email: req.params.email },
      { active: ban },
      { new: true },
      async (err, doc) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!doc) {
          next(new ApiError404("Document not found"));
        } else {
          // major firstName lastName email accessLevel suspension warnings active
          const major = await MajorModel.findById(doc.major);

          const responseDoc = {
            major: major,
            firstName: doc.firstName,
            lastName: doc.lastName,
            email: doc.email,
            accessLevel: doc.accessLevel,
            suspension: doc.suspension,
            warnings: doc.warnings,
            active: doc.active,
          };
          res.status(200).send(responseDoc);
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const getBannedUsers = async (req, res, next) => {
  try {
    if (!req.accountId) throw authError;
    const user = UserModel.findById(req.accountId);
    if (user.accessLevel < 1) throw forbidden;

    UserModel.find({ active: false }, (err, docs) => {
      if (err) {
        throw new ApiError400(err.message);
      } else if (!docs) {
        throw new ApiError404("No users found");
      } else {
        res.status(200).send(docs);
      }
    });
  } catch (err) {
    next(err);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    if (!req.accountId) throw authError;

    const admin = await UserModel.findById(req.accountId);
    if (!admin || admin.accessLevel != 1) throw forbidden;

    const user = UserModel.findById(req.params.id);

    const suspension = {
      isSuspended: true,
      expire: req.body.expireDate,
    };

    user.suspension = suspension;

    await user.save();
  } catch (err) {
    next(err);
  }
};

const removeSuspension = async (req, res, next) => {
  try {
    if (!req.accountId) throw authError;

    const admin = await UserModel.findById(req.accountId);
    if (!admin || admin.accessLevel != 1) throw forbidden;

    const user = UserModel.findById(req.params.id);

    const suspension = {
      isSuspended: false,
      expire: "",
    };

    user.suspension = suspension;

    await user.save();
  } catch (err) {
    next(err);
  }
};

const editPassword = async (req, res, next) => {
  try {
    if (!req.accountId) throw authError;
    if (req.accountId != req.params.id) throw forbidden;

    const user = await UserModel.findById(req.params.id);

    if (!user) throw new ApiError404("No account found.");

    bcrypt.compare(
      req.body.currPassword,
      user.password,
      async (err, result) => {
        if (err) {
          const bcryptError = new ApiError400(err.message);
          next(bcryptError);
        } else {
          if (!result) {
            next(authError);
          } else if (result) {
            const encryptedPassword = await encryptPassword(
              req.body.newPassword
            );

            user.password = encryptedPassword;
            user.customPassword = true;
            user.save((err) => {
              if (err) {
                next(new ApiError400(err.message));
              } else {
                const returnedUser = {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                };
                res.status(200).send(returnedUser);
              }
            });
          }
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const code = Math.floor(Math.random() * 99999) + 1;
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) throw new ApiError404("Account was not found.");

    await user.updateOne({ verificationCode: code });
    const userName = user.firstName;

    const message = `
    ${userName}, use the following link to reset your password: 
    <a href="${process.env.FRONTEND_URI}/reset-password?code=${code}">
    ${process.env.FRONTEND_URI}/reset-password?code=${code}
    </a>`;

    await emailClient("Verification code", message, req.body.email);
    res.status(200).send({ message: "Success." });
  } catch (err) {
    next(err);
  }
};

const approvePasswordReset = async (req, res, next) => {
  try {
    if (!req.body.verificationCode)
      throw new ApiError400("No verification code provided");

    const user = await UserModel.findOne({
      verificationCode: req.body.verificationCode,
    });
    if (!user) throw new ApiError400("Verification code is not correct");

    user.verificationCode = null;
    const encryptedPassword = await encryptPassword(req.body.password);
    user.password = encryptedPassword;
    user.customPassword = true;
    user.save();
    res.status(200).send("Success.");
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  let accountInfo;

  UserModel.findOne({ email: email })
    .then((account) => {
      if (!account || !account.active) {
        throw new ApiError404("Account not found.");
      }
      accountInfo = account;

      if (accountInfo.gmailLogin && accountInfo.password === " ") {
        throw new Api401Error(
          "No password has been set up through us. Please login with Google"
        );
      }
      return bcrypt.compare(password, account.password);
    })
    .then(async (matches) => {
      if (!matches) {
        throw new ApiError401("Wrong password.");
      }
      const token = jwt.sign(
        {
          email: accountInfo.email,
          id: accountInfo._id.toString(),
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
      );
      var major = await MajorModel.findById(accountInfo.major);
      if (!major) major = { name: null };

      res.status(200).send({
        token: token,
        userId: accountInfo._id.toString(),
        major: major.name,
      });
    })
    .catch((err) => {
      next(err);
    });
};

const isLoggedIn = async (req, res, next) => {
  try {
    if (!req.accountId) throw new ApiError401("Not authenticated.");

    UserModel.findById(
      req.accountId,
      "firstName lastName active email customPassword accessLevel",
      (err, doc) => {
        if (err) {
          next(new ApiError400(err.message));
        } else if (!doc || !doc.active) {
          next(new ApiError404("Account not found"));
        } else {
          res.status(200).send(doc);
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const handleGoogleLogin = async (req, res, next) => {
  try {
    const googleJWT = req.body.googleJWT;
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${googleJWT}`
    );
    if (response.status !== 200) throw authError;

    const userData = response.data;

    const user = await UserModel.findOne({ email: userData.email });

    if (user) {
      const userMajor = user.major
        ? await MajorModel.findById(user.major)
        : null;
      if (!user.active) {
        throw new ApiError404("Account not found.");
      }
      const token = jwt.sign(
        { email: req.body.email, id: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "3h" }
      );
      res.status(200).send({
        token: token,
        userId: user._id,
        major: userMajor ? userMajor.name : null,
      });
    } else {
      const newUser = {
        email: userData.email,
        firstName: userData.given_name,
        lastName: userData.family_name,
        password: " ",
        gmailLogin: true,
        customPassword: false,
      };

      UserModel.create(newUser, (err, doc) => {
        if (err) {
          next(new ApiError400(err.message));
        } else {
          const token = jwt.sign(
            { email: doc.email, id: doc._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "3h" }
          );
          res.status(200).send({
            token: token,
            userId: doc._id,
            major: null,
          });
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  isLoggedIn,
  getUserById,
  editUser,
  deleteUser,
  addUser,
  login,
  warnUser,
  suspendUser,
  removeSuspension,
  editPassword,
  getAllUsersPrivate,
  getUserByIdPrivate,
  handleGoogleLogin,
  requestPasswordReset,
  approvePasswordReset,
  banHandler,
  getBannedUsers,
};
