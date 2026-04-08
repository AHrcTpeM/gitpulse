const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');

router.post('/subscribe', subscriptionController.subscribe);
router.get('/confirm/:token', subscriptionController.confirmSubscription);
router.get('/unsubscribe/:token', subscriptionController.unsubscribe);
router.get('/subscriptions', subscriptionController.getSubscriptions);

module.exports = router;
