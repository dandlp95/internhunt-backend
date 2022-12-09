const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 8080;
const db = require("./db/db");
const cors = require("cors");
require("dotenv").config();
const {
  returnError,
  logErrorMiddleware,
} = require("./middleware/error-handling/errorHandler");

db.then(() => {
  app
    .use(express.json())
    .use(cookieParser())
    .use(cors())
    .use((req, res, next) => {
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.setHeader("Content-Type", "application/json");
      next();
    })
    .use("/", require("./routes"))
    .use(logErrorMiddleware)
    .use(returnError);

  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
