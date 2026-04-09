const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');
const authMiddleware = require('./middlewares/auth.middleware');
const {
  validateSubscription,
  validateToken,
  validateGetSubscriptions
} = require('./validators/subscription.validator');

router.post('/subscribe', authMiddleware, validateSubscription, subscriptionController.subscribe);
router.get('/confirm/:token', validateToken, subscriptionController.confirmSubscription);
router.get('/unsubscribe/:token', validateToken, subscriptionController.unsubscribe);
router.get('/subscriptions', authMiddleware, validateGetSubscriptions, subscriptionController.getSubscriptions);

module.exports = router;
