import db from '../../db/db.js';
import Logger from '../utils/logger.js';
import mailClient from '../clients/mail.client.js';
import TemplateEngine from '../utils/template.engine.js';

class NotifierService {
  constructor() {}

  /**
   * Send confirmation email to new subscriber
   */
  async sendConfirmationEmail(email, token) {
    const confirmUrl = `${process.env.APP_URL || 'http://localhost:3000'}/?action=confirm&token=${token}`;

    try {
      await mailClient.send({
        to: email,
        subject: '🚀 Confirm your GitPulse subscription',
        html: TemplateEngine.confirmation(confirmUrl),
      });
      Logger.log('Notifier', `Confirmation email sent to ${email}`);
    } catch (error) {
      Logger.error('Notifier', `Error sending confirmation to ${email}: ${error.message}`);
    }
  }

  /**
   * Notify all confirmed subscribers about a new release
   */
  async notify(repositoryId, newTag) {
    try {
      const subscribers = await db('subscribers')
        .join('subscriptions', 'subscribers.id', 'subscriptions.subscriber_id')
        .join('repositories', 'repositories.id', 'subscriptions.repository_id')
        .where('subscriptions.repository_id', repositoryId)
        .where('subscribers.confirmed', true)
        .select(
          'subscribers.email',
          'subscribers.unsubscribe_token',
          'repositories.owner',
          'repositories.repo'
        );

      if (subscribers.length === 0) {
        Logger.verbose('Notifier', `No confirmed subscribers for repo ID ${repositoryId}`);
        return;
      }

      Logger.log('Notifier', `Sending ${subscribers.length} notifications for ${newTag}`);

      for (const subscriber of subscribers) {
        const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:3000'}/?action=unsubscribe&token=${subscriber.unsubscribe_token}`;

        await mailClient.send({
          to: subscriber.email,
          subject: `🚀 New release: ${subscriber.owner}/${subscriber.repo} — ${newTag}`,
          html: TemplateEngine.newRelease(
            subscriber.owner,
            subscriber.repo,
            newTag,
            unsubscribeUrl
          ),
        });
      }
    } catch (error) {
      Logger.error('Notifier', `Failed to send notifications: ${error.message}`);
    }
  }
}

export default new NotifierService();
