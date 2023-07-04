const express = require("express");
const dotenv = require("dotenv");
const CustomError = require("./utils/customError");
const app = express();
const errorController = require("./controllers/errorControler/errorController");
const authRoute = require("./routes/authRoute");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/v1/users", authRoute);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello World"
  });
});

/* Handling unknown route */
app.all("*", (req, res, next) => {
  next(new CustomError(`Can't find ${req.originalUrl} on the server`, 404));
});

app.use(errorController);

module.exports = app;
