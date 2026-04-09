class TemplateEngine {
  /**
   * Build HTML for the subscription confirmation email
   */
  static confirmation(confirmUrl) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" maxWidth="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="margin-bottom: 24px;">
                <span style="background: linear-gradient(135deg, #238636 0%, #2ea043 100%); color: white; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 24px; letter-spacing: -0.5px; box-shadow: 0 4px 12px rgba(35, 134, 54, 0.3);">GP</span>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.5px;">Welcome to GitPulse</h1>
              <p style="color: #8b949e; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Ready to stay on top of your favorite repositories? Confirm your email to start receiving instant release notifications.
              </p>
              <a href="${confirmUrl}" style="display: inline-block; background-color: #238636; color: #ffffff; text-decoration: none; padding: 14px 38px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                Confirm Subscription
              </a>
              <p style="color: #484f58; font-size: 13px; margin: 32px 0 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0d1117; padding: 24px 40px; text-align: center; border-top: 1px solid #30363d;">
              <p style="color: #6e7681; font-size: 12px; margin: 0;">
                &copy; 2026 GitPulse. Built for developers.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Build HTML for the new release notification email
   */
  static newRelease(owner, repo, newTag, unsubscribeUrl) {
    const repoUrl = `https://github.com/${owner}/${repo}`;
    const releaseUrl = `${repoUrl}/releases/tag/${newTag}`;

    return `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" maxWidth="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 12px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #238636 0%, #2ea043 100%); padding: 32px; text-align: center;">
              <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 1px;">New Release Detected</h2>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 12px;">
                  <a href="${repoUrl}" style="color: #58a6ff; text-decoration: none;">${owner}/${repo}</a>
                </h1>
                <div style="display: inline-block; background-color: rgba(35, 134, 54, 0.15); border: 1px solid #238636; padding: 8px 20px; border-radius: 20px; color: #3fb950; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 20px; font-weight: 600;">
                  ${newTag}
                </div>
              </div>
              
              <div style="text-align: center; margin-bottom: 40px;">
                <p style="color: #8b949e; font-size: 16px; margin-bottom: 24px;">A new version has been published. Stay up to date with the latest changes.</p>
                <a href="${releaseUrl}" style="display: inline-block; background-color: #21262d; border: 1px solid #30363d; color: #c9d1d9; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: all 0.2s;">
                  View Release on GitHub
                </a>
              </div>

              <!-- Footer info -->
              <div style="border-top: 1px solid #30363d; padding-top: 32px; text-align: center;">
                <p style="color: #6e7681; font-size: 13px; margin: 0 0 12px;">You are receiving this because you subscribed to ${owner}/${repo} updates.</p>
                <a href="${unsubscribeUrl}" style="color: #f85149; font-size: 12px; text-decoration: none; font-weight: 500;">
                  Unsubscribe from all notifications
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

export default TemplateEngine;
