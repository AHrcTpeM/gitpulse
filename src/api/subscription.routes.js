const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');
const { 
  validateSubscription, 
  validateToken, 
  validateGetSubscriptions 
} = require('./subscription.validator');

router.post('/subscribe', validateSubscription, subscriptionController.subscribe);
router.get('/confirm/:token', validateToken, subscriptionController.confirmSubscription);
router.get('/unsubscribe/:token', validateToken, subscriptionController.unsubscribe);
router.get('/subscriptions', validateGetSubscriptions, subscriptionController.getSubscriptions);

module.exports = router;
