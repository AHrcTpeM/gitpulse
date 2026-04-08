const subscriptions = [];

const subscriptionController = {
  subscribe: (req, res) => {
    const { email, repo } = req.body;
    const exists = subscriptions.find(s => s.email === email && s.repo === repo);
    if (exists) return res.status(409).json({ message: 'Email already subscribed' });

    const newSub = { 
      email, repo, confirmed: false, 
      confirmation_token: `conf-${Date.now()}`, 
      unsubscribe_token: `unsub-${Date.now()}` 
    };
    subscriptions.push(newSub);
    res.status(200).json({ message: 'Subscription successful', debug: newSub });
  },

  confirmSubscription: (req, res) => {
    const sub = subscriptions.find(s => s.confirmation_token === req.params.token);
    if (!sub) return res.status(404).json({ message: 'Token not found' });
    sub.confirmed = true;
    res.status(200).json({ message: 'Confirmed successfully' });
  },

  unsubscribe: (req, res) => {
    const idx = subscriptions.findIndex(s => s.unsubscribe_token === req.params.token);
    if (idx === -1) return res.status(404).json({ message: 'Token not found' });
    subscriptions.splice(idx, 1);
    res.status(200).json({ message: 'Unsubscribed successfully' });
  },

  getSubscriptions: (req, res) => {
    res.status(200).json(subscriptions.filter(s => s.email === req.query.email));
  }
};

module.exports = subscriptionController;
