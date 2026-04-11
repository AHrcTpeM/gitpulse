class TemplateEngine {
  /**
   * Build HTML for the subscription confirmation email
   */
  static confirmation(confirmUrl) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" maxWidth="500" cellpadding="0" cellspacing="0" style="max-width:500px; background-color:#1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <!-- Logo with Gradient look -->
              <div style="margin-bottom: 24px;">
                <span style="background-color: #6366f1; color: white; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 24px; display: inline-block;">GP</span>
              </div>
              
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.5px;">Welcome to GitPulse</h1>
              
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Stay updated with GitHub releases. Confirm your email to start receiving instant notifications.
              </p>
              
              <!-- Primary Button -->
              <a href="${confirmUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                Confirm Subscription
              </a>
              
              <p style="color: #64748b; font-size: 13px; margin: 32px 0 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer Branding -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                &copy; 2026 GitPulse. Built for developers by <strong style="color: #818cf8;">Ihor Popkov</strong>
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
<body style="margin:0; padding:0; background-color:#0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" maxWidth="500" cellpadding="0" cellspacing="0" style="max-width:500px; background-color:#1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <!-- Gradient Header Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(to right, #818cf8, #c084fc);"></td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #818cf8; font-size: 14px; font-weight: 700; margin: 0 0 24px; text-transform: uppercase; letter-spacing: 2px; text-align: center;">New Release Detected</h2>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 16px;">
                  <a href="${repoUrl}" style="color: #ffffff; text-decoration: none;">${owner}/${repo}</a>
                </h1>
                <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.1); border: 1px solid #6366f1; padding: 10px 24px; border-radius: 20px; color: #818cf8; font-family: monospace; font-size: 22px; font-weight: 700;">
                  ${newTag}
                </div>
              </div>
              
              <div style="text-align: center; margin-bottom: 40px;">
                <p style="color: #94a3b8; font-size: 16px; margin-bottom: 24px; line-height: 1.6;">A new version is available! Stay up to date with the latest features and fixes.</p>
                <a href="${releaseUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                  View on GitHub
                </a>
              </div>

              <!-- Unsubscribe info -->
              <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 32px; text-align: center;">
                <p style="color: #64748b; font-size: 13px; margin: 0 0 12px;">You are receiving this because you subscribed to ${owner}/${repo} updates.</p>
                <a href="${unsubscribeUrl}" style="color: #f87171; font-size: 12px; text-decoration: none; font-weight: 500;">
                  Unsubscribe
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer Branding -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                &copy; 2026 GitPulse. Built for developers by <strong style="color: #818cf8;">Ihor Popkov</strong>
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
}

export default TemplateEngine;
