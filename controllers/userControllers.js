const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());
const catchAsync = require('./../utilis/catchAsync');
const User = require('./../models/userModel');
const factory = require('./handlerFactory');
const { userInfo } = require('os');
const AppError = require('../utilis/AppError');

exports.dontChangePassword = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passConfirmed) {
    return next(new AppError(`you haven't permission to change password`, 401));
  }
  next();
});

exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
exports.updateUser = factory.deleteOne(User);
exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    message: "this route isn't defined. Use /signup to create an user account"
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};
