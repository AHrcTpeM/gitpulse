const { body, query, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateSubscription = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ max: 100 }).withMessage('Email is too long (max 100 characters)')
    .normalizeEmail(),
  body('repo')
    .notEmpty().withMessage('Repository name is required')
    .isLength({ max: 100 }).withMessage('Repository name is too long (max 100 characters)')
    .matches(/^[a-zA-Z0-9-._]+\/[a-zA-Z0-9-._]+$/).withMessage('Repository must be in format owner/repo')
    .trim(),
  validate,
];

const validateToken = [
  param('token')
    .notEmpty().withMessage('Token is required')
    .isLength({ max: 255 }).withMessage('Token is too long')
    .isString(),
  validate,
];

const validateGetSubscriptions = [
  query('email')
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ max: 100 }).withMessage('Email is too long (max 100 characters)')
    .normalizeEmail(),
  validate,
];

module.exports = {
  validateSubscription,
  validateToken,
  validateGetSubscriptions,
};
