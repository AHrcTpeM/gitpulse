const subscriptionService = require('../core/services/subscription.service');

const subscriptionController = {
  subscribe: async (req, res, next) => {
    try {
      const { email, repo } = req.body;
      const result = await subscriptionService.subscribe(email, repo);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  confirmSubscription: async (req, res, next) => {
    try {
      const { token } = req.params;
      const result = await subscriptionService.confirm(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  unsubscribe: async (req, res, next) => {
    try {
      const { token } = req.params;
      const result = await subscriptionService.unsubscribe(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  getSubscriptions: async (req, res, next) => {
    try {
      const { email } = req.query;
      const subscriptions = await subscriptionService.getAllByEmail(email);
      res.status(200).json(subscriptions);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = subscriptionController;
