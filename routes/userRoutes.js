const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userControllers');
const authController = require('./../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
// router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//protect all routes
router.use(authController.protect);
router.patch(
  '/updateMyPassword',

  authController.updatePassword
);
router.patch(
  '/updateMe',
  authController.uploadUserPhoto,
  authController.resizeUserPhoto,
  authController.updateMe
);
router.delete('/deleteMe', authController.deleteMe);
router.route('/me').get(userControllers.getMe, userControllers.getUser);
router;

router
  .use(authController.restrictTo('admin'))

  .route('/')
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

router
  .route('/:id')
  .get(userControllers.getUser)
  .patch(userControllers.dontChangePassword, userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;
