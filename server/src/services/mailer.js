const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../utils/logger");

let transporter = null;

function isMailConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter() {
  if (!isMailConfigured()) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOtpHtml({ otp, ttlMinutes, email }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Password Reset Code — AskDB</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 24px 16px !important; }
      .otp-code { font-size: 34px !important; letter-spacing: 6px !important; }
      .headline { font-size: 20px !important; }
      .brand-logo { width: 180px !important; height: auto !important; }
    }
  </style>
  <base target="_blank">
</head>
<body style="margin:0; padding:0; background-color:#f8f9fa; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased; color:#1a1a1e;">

  <!-- Outer Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding: 48px 16px;">

        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="520" style="max-width:520px; width:100%; background-color:#ffffff; border-radius:16px; border:1px solid #e6e8ec; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.03);">

          <!-- Header / Brand Logo -->
          <tr>
            <td align="center" style="padding:40px 40px 20px 40px;">
              
              <!-- Data-URI Image Logo (Safe for Gmail & Outlook) -->
              <img class="brand-logo" src="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20260%2070%20%22%20width%3D%22260%22%20height%3D%2270%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%2270%22%20height%3D%2270%22%20rx%3D%2218%22%20fill%3D%22%23C2C6FF%22%20%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23131318%22%20stroke-width%3D%224.2%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(5%2C%205)%22%3E%3Cellipse%20cx%3D%2230%22%20cy%3D%2221%22%20rx%3D%2215%22%20ry%3D%226%22%20%2F%3E%3Cpath%20d%3D%22M%2015%2021%20v%2010%20c%200%203.2%206.7%206%2015%206%20s%2015%20-2.8%2015%20-6%20v%20-10%22%20%2F%3E%3Cpath%20d%3D%22M%2015%2031%20v%2010%20c%200%203.2%206.7%206%2015%206%20s%2015%20-2.8%2015%20-6%20v%20-10%22%20%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%2290%22%20y%3D%2250%22%20font-family%3D%22Inter%2C%20system-ui%2C%20sans-serif%22%20font-size%3D%2248%22%20font-weight%3D%22800%22%20letter-spacing%3D%22-2%22%20fill%3D%22%23131318%22%3EAskDB%3C%2Ftext%3E%3C%2Fsvg%3E" alt="AskDB Logo" width="180" height="48" style="display:block; border:0; outline:none; text-decoration:none;" />

              <p style="margin:12px 0 0 0; font-size:10px; font-weight:700; color:#625df5; text-transform:uppercase; letter-spacing:0.18em;">Enterprise Intelligence</p>
            </td>
          </tr>

          <!-- Content Header -->
          <tr>
            <td style="padding:12px 40px 0 40px; text-align:center;">
              <h1 class="headline" style="margin:0 0 8px 0; font-family:'Geist', 'Inter', sans-serif; font-size:24px; font-weight:700; color:#131318; letter-spacing:-0.01em;">
                Reset Your Password
              </h1>
              <p style="margin:0; font-size:14px; color:#52525b; line-height:1.6;">
                Use the verification code below to reset your AskDB account password.
              </p>
            </td>
          </tr>

          <!-- Highlighted OTP Section -->
          <tr>
            <td style="padding:28px 40px 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:28px 20px; background-color:#f4f3ff; border:1px solid #e0ddff; border-radius:14px;">
                    <p style="margin:0 0 8px 0; font-size:11px; font-weight:700; color:#4338ca; text-transform:uppercase; letter-spacing:0.15em;">Your Verification Code</p>
                    <p class="otp-code" style="margin:0; font-family:'JetBrains Mono', 'Courier New', monospace; font-size:40px; font-weight:800; color:#131318; letter-spacing:10px; line-height:1;">
                      {{OTP}}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry & Security Notice -->
          <tr>
            <td style="padding:0 40px 32px 40px; text-align:center;">
              <p style="margin:0 0 16px 0; font-size:13px; font-weight:600; color:#0284c7; background-color:#f0f9ff; padding:10px 14px; border-radius:8px; border:1px solid #e0f2fe; display:inline-block;">
                &#9432; Expires in {{TTL}} minutes
              </p>
              <p style="margin:0; font-size:12px; color:#71717a; line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email. Your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background-color:#f4f4f5; width:100%;"></div>
            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px; text-align:center;">
              <p style="margin:0 0 4px 0; font-size:12px; font-weight:600; color:#131318;">AskDB Team</p>
              <p style="margin:0 0 16px 0; font-size:11px; color:#71717a;">Enterprise Data Intelligence Platform</p>

              <p style="margin:16px 0 0 0; font-size:10px; color:#a1a1aa;">
                &copy; ${new Date().getFullYear()} AskDB AI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px; width:100%; margin-top:16px;">
          <tr>
            <td align="center" style="padding:0 16px;">
              <p style="margin:0; font-size:11px; color:#a1a1aa; line-height:1.5;">
                This email was sent to <strong style="color:#71717a;">{{EMAIL}}</strong>. If you have questions, contact our <a href="#" style="color:#625df5; text-decoration:none;">support team</a>.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

async function sendOtpEmail(to, otp) {
  const subject = "Your Password Reset Code — AskDB";
  const text =
    `Hi there,\n\n` +
    `Your verification code is: ${otp}\n\n` +
    `This code will expire in ${env.otp.ttlMinutes} minutes.\n\n` +
    `If you didn't request this, please ignore this email.\n\n` +
    `Best regards,\nAskDB Team`;
  const html = buildOtpHtml({ otp, ttlMinutes: env.otp.ttlMinutes, email: to });

  const transport = getTransporter();
  if (!transport) {
    // SMTP not configured yet (user adds Gmail app password later).
    logger.warn("SMTP not configured; skipping OTP email send", { to });
    if (env.nodeEnv === "development") {
      logger.info(`[dev-only] password reset OTP for ${to}: ${otp}`);
    }
    return { sent: false, reason: "smtp_not_configured" };
  }

  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
    html,
  });
  return { sent: true };
}

module.exports = { isMailConfigured, sendOtpEmail, buildOtpHtml };
