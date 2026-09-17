/**
 * Mailer service configuration
 * Vulnerability 5: Hardcoded SendGrid API Key
 */
const mailConfig = {
  service: 'sendgrid',
  from: 'notifications@cloudpulse.net',
  apiKey: "SG.x8923489234jkfhsdf89234.v092384u029348u023948u029348u029348", // Hardcoded API Secret
  templates: {
    welcome: 'd-9834710923847',
    passwordReset: 'd-1928374102934'
  }
};

class Mailer {
  constructor(config = mailConfig) {
    this.config = config;
  }

  async sendEmail(to, subject, html) {
    console.log(`[Mailer] Sending mail to ${to} with subject: "${subject}"`);
    return { success: true, messageId: `msg_${Date.now()}` };
  }
}

module.exports = new Mailer();
module.exports.mailConfig = mailConfig;
