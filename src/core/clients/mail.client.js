import nodemailer from 'nodemailer';
import Logger from '../utils/logger.js';

class MailClient {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    Logger.log('MailClient', 'Initialized');
  }

  /**
   * Універсальний метод для відправки пошти
   * @param {Object} options
   * @param {string} options.to - Отримувач
   * @param {string} options.subject - Тема
   * @param {string} options.html - Тіло листа (HTML)
   */
  async send({ to, subject, html }) {
    const isDev = process.env.NODE_ENV === 'dev';
    const devEmail = process.env.DEV_DEFAULT_EMAIL;

    let finalRecipient = to;
    let finalSubject = subject;

    if (isDev && devEmail) {
      Logger.verbose('MailClient', `DEV MODE: Redirecting email from ${to} to ${devEmail}`);
      finalRecipient = devEmail;
      finalSubject = `[DEV] ${subject}`;
    }

    try {
      await this.transporter.sendMail({
        from: `"GitPulse" <${process.env.SMTP_USER}>`,
        to: finalRecipient,
        subject: finalSubject,
        html: html,
      });

      Logger.log('MailClient', `Email sent to ${finalRecipient}`);
      return true;
    } catch (error) {
      Logger.error('MailClient', `Failed to send email to ${finalRecipient}: ${error.message}`);
      throw error;
    }
  }
}

export default new MailClient();
