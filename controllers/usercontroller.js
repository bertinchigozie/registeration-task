const express = require("express");
const { promisify } = require("util");
const crypto = require("crypto");
const User = require("../models/user");
const mail = require("../utils/email");
const jwt = require("jsonwebtoken");
const CustomError = require("../utils/customError");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return next(new CustomError("Email already Exist", 400));
    }
    const oldUser1 = await User.findOne({ username });
    if (oldUser1) {
      return next(new CustomError("Username already Exist", 400));
    }

    const newUser = await User.create({
      username,
      email,
      password
    });
    if (!newUser) {
      User.deleteOne({ newUser });
      return next(new CustomError("Unable to create new User", 500));
    }
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.EXPIRES_IN
    });
    const msg = `<p> Dear ${username}, </p> 
    <p>Welcome To My App! 
    I hope you enjoy using the app.</p>`;
    const subject = "Thanks for registering with us.";
    await mail(email, subject, msg);

    return res.status(201).json({
      status: "Success",
      token
    });
  } catch (error) {
    return next(new CustomError(error.message, 400));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return next(new CustomError("Please provide username and password", 401));
    }
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password, user.password))) {
      return next(new CustomError("Incorrect username or password", 401));
    }
    if (user && !(await user.comparePassword(password, user.password))) {
      return next(new CustomError("Incorrect username or password", 401));
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.EXPIRES_IN
    });
    res.status(200).json({
      status: "success",
      token
    });
  } catch (error) {
    return next(new CustomError(error.message, 400));
  }
};

exports.authorizedRoute = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new CustomError("You are not logged in! Please log in to get access", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new CustomError("The user belonging to this token no longer exist.", 401)
    );
  }
  req.user = user;

  return next();
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new CustomError("There is no user with the email!", 401));
  }

  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `<a
        href=https://banao-task.onrender.com/resetPassword/${resetToken}
      >
        Reset Password
      </a>`;

    const subject = "Your token is valid for only 10 minutes";

    await mail(user.email, subject, resetURL);

    return res.status(200).json({
      status: "success",
      message: "Token sent to email"
    });
  } catch (error) {
    console.log(error);
    (user.resetPasswordToken = undefined),
      (user.passwordTokenExpire = undefined),
      await user.save({ validateBeforeSave: false });
    return next(new CustomError("There is an error. Try again", 500));
  }
};

exports.resetPassword = async (req, res, next) => {
  console.log(req.params.resetToken);
  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashToken,
    passwordTokenExpire: { $gt: Date.now() }
  });
  if (!user) {
    return next(new CustomError("Token is invalid or has expired"));
  }
  user.password = req.body.password;
  (user.resetPasswordToken = undefined), (user.passwordTokenExpire = undefined);
  await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN
  });
  res.status(200).json({
    status: "Success",
    token
  });
};
