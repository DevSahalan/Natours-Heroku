const catchAsync = require('./../utilis/catchAsync');
const AppError = require('./../utilis/AppError');
const APIFeatures = require('./../utilis/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`there's no document with this id`, 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError(`there's no document with this id`, 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);

    const doc = await query;

    if (!doc) {
      return next(new AppError(`there's no document with this id`, 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // Build query
    // console.log(req.query);

    // Filtering
    // const queryObj = { ...req.query };
    // const excludedDFields = ['page', 'sort', 'limit', 'fields'];
    // excludedDFields.forEach(el => delete queryObj[el]);
    // console.log(queryObj);

    // // advanced filtering
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(
    //   /\b(gte)|(gt)|(lte)|(lt)\b/g,
    //   match => `$${match}`
    // );
    // console.log(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));

    // Sorting

    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   console.log(sortBy);
    //   query = query.sort(sortBy);
    // } else {
    //   query = query.sort('-createdAt');
    // }

    // Limiting

    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   console.log(fields);
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }

    // Pagination
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;

    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error("the page doesn't exist");
    // }
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // const tours = await Tour.find();

    // send response
    res.status(201).json({
      status: 'success',
      results: doc.length,
      data: {
        doc
      }
    });
  });
