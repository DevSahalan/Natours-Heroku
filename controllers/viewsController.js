const Tour = require('./../models/tourModel');
const catchAsync = require('./../utilis/catchAsync');
const User = require('./../models/userModel');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'all tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res) => {
  const tour = await Tour.findOne({
    slug: req.params.slug
  }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  res.status(200).render('tour', {
    title: 'the forest hiker',
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log Into Your Account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account'),
    {
      title: 'your account'
    };
};

exports.signUp = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign Up'
  });
};

// exports.submitUserData = catchAsync(async (req, res) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email
//     },
//     {
//       new: true,
//       runValidators: true
//     }
//   );

//   res.status(200).render('account', {
//     user: updatedUser
//   });
// });
