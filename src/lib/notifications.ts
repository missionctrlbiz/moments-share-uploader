import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "Moments <onboarding@resend.dev>";

interface UploadNotification {
  type: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  message: string;
  fileCount: number;
  fileNames: string[];
  timestamp: string;
}

export async function sendUploadNotification(data: UploadNotification) {
  if (!NOTIFICATION_EMAIL || !process.env.RESEND_API_KEY) {
    console.log("Email notifications not configured, skipping");
    return;
  }

  const date = new Date(data.timestamp);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #fafafa;">
      <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #6366f1, #ec4899); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">📸 New Upload!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Someone shared something with you</p>
        </div>
        <div style="padding: 24px;">
          <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">From</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0a0a0a;">${data.senderName || "Anonymous"}</p>
          </div>
          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            <div style="flex: 1; background: #f3f4f6; border-radius: 12px; padding: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">Type</p>
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0a0a0a; text-transform: capitalize;">${data.type}</p>
            </div>
            <div style="flex: 1; background: #f3f4f6; border-radius: 12px; padding: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">Files</p>
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0a0a0a;">${data.fileCount}</p>
            </div>
          </div>
          ${
            data.fileNames.length > 0
              ? `
            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">Files</p>
              ${data.fileNames
                .map(
                  (name) =>
                    `<div style="background: #f3f4f6; border-radius: 8px; padding: 10px 12px; margin-bottom: 4px; font-size: 13px; color: #374151;">📎 ${name}</div>`
                )
                .join("")}
            </div>
          `
              : ""
          }
          ${
            data.message
              ? `
            <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">Message</p>
              <p style="margin: 0; font-size: 14px; color: #374151;">${data.message}</p>
            </div>
          `
              : ""
          }
          ${
            data.senderPhone || data.senderEmail
              ? `
            <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">Contact</p>
              ${data.senderPhone ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #374151;">📱 ${data.senderPhone}</p>` : ""}
              ${data.senderEmail ? `<p style="margin: 0; font-size: 13px; color: #374151;">✉️ ${data.senderEmail}</p>` : ""}
            </div>
          `
              : ""
          }
          <div style="text-align: center; padding-top: 8px;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">${formattedDate} at ${formattedTime}</p>
          </div>
        </div>
        <div style="padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Moments by Bibi</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFICATION_EMAIL,
    subject: `📸 ${data.senderName || "Someone"} shared a ${data.type} with you!`,
    html,
  });
}

export async function sendAdminAlert(subject: string, body: string) {
  if (!NOTIFICATION_EMAIL || !process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFICATION_EMAIL,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>${subject}</h2>
        <p>${body}</p>
      </body>
      </html>
    `,
  });
}
