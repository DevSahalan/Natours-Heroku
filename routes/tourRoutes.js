const express = require('express');
const router = express.Router();
const tourControllers = require('../controllers/tourControllers');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const APIFeatures = require('./../utilis/apiFeatures');
// const reviewController = require('./../controllers/reviewController');
// router.param('id', tourControllers.checkId);

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourControllers.getTourWithin);

router.route('/distances/:latlng/unit/:unit').get(tourControllers.getDistances);

router.route('/tour-stats').get(tourControllers.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.getMonthlyPlan
  );

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'user'),
    tourControllers.createTour
  )
  .get(tourControllers.getAllTours);

router
  .route('/:id')
  .get(tourControllers.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'user'),
    tourControllers.uploadTourImages,
    tourControllers.resizeTourImages,
    tourControllers.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.deleteTour
  );

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
module.exports = router;
