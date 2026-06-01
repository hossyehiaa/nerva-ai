import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use resend.dev for testing, or custom domain when configured
const FROM_EMAIL = process.env.EMAIL_FROM || 'Nerva AI <onboarding@resend.dev>';

interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  userName?: string | null;
}

export async function sendPasswordResetEmail({ to, resetUrl, userName }: SendPasswordResetEmailParams) {
  const name = userName || 'User';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #0a0f1c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #0a0f1c; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="max-width: 480px;">
              <!-- Logo -->
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #00e5ff, #2979ff); width: 40px; height: 40px; border-radius: 10px; text-align: center; vertical-align: middle;">
                        <span style="color: #0a0f1c; font-size: 20px; font-weight: bold;">N</span>
                      </td>
                      <td style="padding-left: 10px;">
                        <span style="color: #ffffff; font-size: 20px; font-weight: bold;">Nerva AI</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Card -->
              <tr>
                <td style="background: #111827; border: 1px solid #1e293b; border-radius: 16px; padding: 40px;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                    Reset Your Password
                  </h1>
                  <p style="color: #94a3b8; font-size: 16px; margin: 0 0 24px 0;">
                    Hi ${name}, we received a request to reset your password. Click the button below to create a new one.
                  </p>

                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00e5ff, #2979ff); color: #0a0f1c; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">
                    This link will expire in <strong style="color: #94a3b8;">1 hour</strong> for security.
                  </p>

                  <div style="border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 16px;">
                    <p style="color: #64748b; font-size: 13px; margin: 0;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #00e5ff; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
                      ${resetUrl}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding-top: 24px;">
                  <p style="color: #475569; font-size: 12px; margin: 0;">
                    If you didn't request a password reset, you can safely ignore this email.
                  </p>
                  <p style="color: #475569; font-size: 12px; margin: 8px 0 0 0;">
                    &copy; ${new Date().getFullYear()} Nerva AI. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Nerva AI — Reset Your Password

Hi ${name},

We received a request to reset your password. Click the link below to create a new one:

${resetUrl}

This link will expire in 1 hour for security.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Nerva AI. All rights reserved.
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Your Nerva AI Password',
      html,
      text,
    });
    console.log('[Email] Password reset email sent:', result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    return { success: false, error: String(error) };
  }
}

interface SendPasswordChangedEmailParams {
  to: string;
  userName?: string | null;
}

export async function sendPasswordChangedEmail({ to, userName }: SendPasswordChangedEmailParams) {
  const name = userName || 'User';
  const loginUrl = 'https://nerva-ai.vercel.app';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #0a0f1c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #0a0f1c; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="max-width: 480px;">
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #00e5ff, #2979ff); width: 40px; height: 40px; border-radius: 10px; text-align: center; vertical-align: middle;">
                        <span style="color: #0a0f1c; font-size: 20px; font-weight: bold;">N</span>
                      </td>
                      <td style="padding-left: 10px;">
                        <span style="color: #ffffff; font-size: 20px; font-weight: bold;">Nerva AI</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background: #111827; border: 1px solid #1e293b; border-radius: 16px; padding: 40px;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                    Password Changed Successfully
                  </h1>
                  <p style="color: #94a3b8; font-size: 16px; margin: 0 0 24px 0;">
                    Hi ${name}, your Nerva AI password has been changed. If you made this change, no further action is needed.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00e5ff, #2979ff); color: #0a0f1c; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                          Sign In Now
                        </a>
                      </td>
                    </tr>
                  </table>
                  <div style="border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px;">
                    <p style="color: #ef4444; font-size: 14px; margin: 0;">
                      <strong>⚠️ If you did NOT make this change</strong>, please contact us immediately at support@nerva.ai to secure your account.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your Nerva AI Password Was Changed',
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send password changed email:', error);
    return { success: false, error: String(error) };
  }
}
