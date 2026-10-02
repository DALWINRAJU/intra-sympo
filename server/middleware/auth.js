const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const environment = require('../config/environment');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  const decoded = jwt.verify(token, environment.jwtSecret);
  req.user = decoded;
  next();
});

module.exports = protect;
