import express from 'express';
import subscriptionController from './subscription.controller.js';
import authMiddleware from './middlewares/auth.middleware.js';
import {
  validateSubscription,
  validateToken,
  validateGetSubscriptions,
} from './validators/subscription.validator.js';

const router = express.Router();

router.post('/subscribe', authMiddleware, validateSubscription, subscriptionController.subscribe);
router.get('/confirm/:token', validateToken, subscriptionController.confirmSubscription);
router.get('/unsubscribe/:token', validateToken, subscriptionController.unsubscribe);
router.get(
  '/subscriptions',
  authMiddleware,
  validateGetSubscriptions,
  subscriptionController.getSubscriptions
);

export default router;
