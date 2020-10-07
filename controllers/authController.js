const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utilis/catchAsync');
const AppError = require('../utilis/AppError');
const sendEmail = require('../utilis/email');
const { collection } = require('./../models/userModel');
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image!Please upload only image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });
  user.password = undefined;
  // console.log(newUser);
  res.status(statusCode).json({
    status: 'success',
    token,
    user: user
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passConfirmed: req.body.passConfirmed,
    passwordChangedAt: req.body.passwordChangedAt,
    photo: req.body.photo
  });
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // });
  createSendToken(newUser, 201, req, res);
  // const token = signToken(newUser._id);

  // // console.log(newUser);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   user: newUser
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1. if email and password exist
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  // 2.if user exist && password is correct
  const user = await User.findOne({ email }).select('+password');
  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`incorrect email or password`, 401));
  }

  // 3.send token
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // });
  createSendToken(user, 200, req, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. get token and check if there's any token
  // if (
  //   req.headers.authorization &&
  //   req.headers.authorization.startsWith('Bearer')
  // ) {
  //   token = req.headers.authorization.split(' ')[1];
  // } else if (req.cookies.jwt) {
  //   token = req.cookies.jwt;
  // }
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);

  if (!token) {
    return next(
      new AppError(`you aren't logged in.please log in to get access`, 401)
    );
  }

  // 1. verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 1. check if user is still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(`the user belonging to this token do no longer exist`, 401)
    );
  }
  // 1. check if password changed after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(`User recently changed password,please login again`, 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1. verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 1. check if user is still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 1. check if password changed after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = currentUser;
      return next();
    }
  } catch (error) {
    return next();
  }

  next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`you do not have permission to perform this action`, 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passConfirmed to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passConfirmed = req.body.passConfirmed;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 2.update passwordChangedAt property

  // 3.log in the user
  createSendToken(user, 200, req, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passConfirmed = req.body.passwConfirmed;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1.Create error if there is password
  // console.log(req.body);
  // console.log(req.file);
  if (req.body.password || req.body.passConfirmed) {
    return next(
      new AppError(
        `this route isn't for password update.please use /updateMyPassword to update password`,
        400
      )
    );
  }

  // 2.update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    user: updatedUser
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    message: 'user is deleted successfully'
  });
});
