const AppError = require('./../utilis/AppError');

const handleCastErrorDb = err => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDb = err => {
  console.log(err.keyValue.name);
  // const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const value = err.keyValue.name;
  const message = `Duplicate field : ${value}. please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDb = err => {
  const errors = Object.values(err.errors).map(el => el.properties.message);
  const message = `invalid input data.${errors.join(' .')}`;
  return new AppError(message, 400);
};

const handleJwtError = () => {
  return new AppError(`invalid token.please login again`, 401);
};

const handleJwtExpiredError = () => {
  return new AppError(`your token has expired.please login again`, 401);
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    console.error('ERROR', err);

    res.status(500).json({
      status: 'error',
      message: 'something went very wrong'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.kind === 'ObjectId') error = handleCastErrorDb(error);
    if (error.code === 11000) error = handleDuplicateFieldDb(error);
    if (error._message === 'Validation failed')
      error = handleValidationErrorDb(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError();
    if (error.name === 'TokenExpiredError') error = handleJwtExpiredError();
    sendErrorProd(error, res);
  }
};
