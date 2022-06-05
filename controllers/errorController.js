const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = err => new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = err => new AppError('Your token has expired. Please log in again', 401)

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // Rendered Website
  console.error("ERROR", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went Wrong",
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    // A) Operational error is trusted and message can be sent to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unkown errors should not be seen by the client
    // 1) Log error
    console.error("ERROR", err);

    // 2) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
  }
  // B) Rendered Website
  // B) Operational error is trusted and message can be sent to the client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went Wrong",
      msg: err.message,
    });
  }
  // B) Programming or other unkown errors should not be seen by the client
  // 1) Log error
  console.error("ERROR", err);

  // 2) Send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went Wrong",
    msg: "Please try again later",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res, next);
  } else if (process.env.NODE_ENV.trim() === "production") {
    let error = { ...err };
    error.message = err.message

    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(err);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(err);
    sendErrorProd(error, req, res);
  }
};
