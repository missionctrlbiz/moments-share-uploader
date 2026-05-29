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

const styles = ["electric", "minimal", "warm", "playful"] as const;
type Style = (typeof styles)[number];

function getStyle(type: string): Style {
  const map: Record<string, Style> = {
    photo: "electric",
    video: "playful",
    link: "minimal",
    file: "warm",
  };
  return map[type] || styles[Math.floor(Math.random() * styles.length)];
}

function formatDate(timestamp: string) {
  const date = new Date(timestamp);
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
  return { formattedDate, formattedTime };
}

function sharedTemplate(data: UploadNotification, style: Style) {
  const { formattedDate, formattedTime } = formatDate(data.timestamp);
  const senderDisplay = data.senderName || "Anonymous";

  const gradients: Record<Style, string> = {
    electric: "linear-gradient(135deg, #6366f1, #ec4899)",
    minimal: "linear-gradient(135deg, #18181b, #3f3f46)",
    warm: "linear-gradient(135deg, #f59e0b, #ef4444)",
    playful: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
  };

  const emojis: Record<Style, string> = {
    electric: "⚡",
    minimal: "✦",
    warm: "🌟",
    playful: "🎉",
  };

  const headlines: Record<Style, string> = {
    electric: `${senderDisplay} just lit up your inbox!`,
    minimal: `A moment arrived from ${senderDisplay}`,
    warm: `${senderDisplay} shared something with love`,
    playful: `${senderDisplay} sent you a surprise!`,
  };

  const subtitles: Record<Style, string> = {
    electric: "Tap in to see what they shared",
    minimal: "Something new is waiting for you",
    warm: "A memory, captured and sent your way",
    playful: "Open your dashboard to check it out!",
  };

  const gradient = gradients[style];
  const emoji = emojis[style];
  const headline = headlines[style];
  const subtitle = subtitles[style];

  return { formattedDate, formattedTime, senderDisplay, gradient, emoji, headline, subtitle };
}

function buildAdminHtml(data: UploadNotification): { html: string; subject: string } {
  const style = getStyle(data.type);
  const t = sharedTemplate(data, style);

  const fileList = data.fileNames.length > 0
    ? data.fileNames
        .map(
          (name) =>
            `<div style="background: #f3f4f6; border-radius: 8px; padding: 10px 12px; margin-bottom: 4px; font-size: 13px; color: #374151;">📎 ${name}</div>`
        )
        .join("")
    : "";

  const messageBlock = data.message
    ? `
    <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Message</p>
      <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">${data.message}</p>
    </div>`
    : "";

  const contactBlock = data.senderPhone || data.senderEmail
    ? `
    <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Contact</p>
      ${data.senderPhone ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #374151;">📱 ${data.senderPhone}</p>` : ""}
      ${data.senderEmail ? `<p style="margin: 0; font-size: 13px; color: #374151;">✉️ ${data.senderEmail}</p>` : ""}
    </div>`
    : "";

  const subject = `${t.emoji} ${data.senderName || "Someone"} shared a ${data.type} with you`;

  return { html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #fafafa;">
      <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        <div style="background: ${t.gradient}; padding: 40px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">${t.headline}</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">${t.subtitle}</p>
        </div>
        <div style="padding: 28px;">
          <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">From</p>
            <p style="margin: 0; font-size: 17px; font-weight: 600; color: #0a0a0a;">${t.senderDisplay}</p>
          </div>
          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            <div style="flex: 1; background: #f3f4f6; border-radius: 12px; padding: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Type</p>
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0a0a0a; text-transform: capitalize;">${data.type}</p>
            </div>
            <div style="flex: 1; background: #f3f4f6; border-radius: 12px; padding: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Files</p>
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0a0a0a;">${data.fileCount}</p>
            </div>
          </div>
          ${fileList ? `<div style="margin-bottom: 16px;">${fileList}</div>` : ""}
          ${messageBlock}
          ${contactBlock}
          <div style="text-align: center; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">${t.formattedDate} at ${t.formattedTime}</p>
          </div>
        </div>
        <div style="padding: 14px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Moments by Bibi &middot; Built with love</p>
        </div>
      </div>
    </body>
    </html>
  `, subject };
}

function buildThankYouHtml(data: UploadNotification): string {
  const { formattedDate, formattedTime } = formatDate(data.timestamp);
  const senderName = data.senderName || "friend";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #fafafa;">
      <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 40px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 36px; line-height: 1;">&#127881;</h1>
          <h2 style="color: white; margin: 12px 0 0 0; font-size: 20px; font-weight: 700;">Thanks for sharing!</h2>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">Your ${data.type} has been delivered</p>
        </div>
        <div style="padding: 28px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
              Heyy ${senderName},<br/><br/>
              Your ${data.type}${data.fileCount > 1 ? "s" : ""} ${data.fileCount > 1 ? "have" : "has"} been sent to Bibi successfully. They'll check it out soon!
            </p>
          </div>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #166534;">
              &#10003; ${data.fileCount} file${data.fileCount !== 1 ? "s" : ""} delivered<br/>
              &#10003; ${formattedDate} at ${formattedTime}
            </p>
          </div>
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">
              This was sent via Moments — a beautiful way to share things with people you meet.
            </p>
          </div>
        </div>
        <div style="padding: 14px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Moments by Bibi</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendUploadNotification(data: UploadNotification) {
  if (!NOTIFICATION_EMAIL || !process.env.RESEND_API_KEY) {
    console.log("Email notifications not configured, skipping");
    return;
  }

  const { html, subject } = buildAdminHtml(data);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFICATION_EMAIL,
    subject,
    html,
  });
}

export async function sendThankYou(data: UploadNotification) {
  if (!data.senderEmail || !process.env.RESEND_API_KEY) return;

  const html = buildThankYouHtml(data);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.senderEmail,
    subject: `You shared a ${data.type} with Bibi!`,
    html,
  });
}

export async function sendAdminAlert(
  level: "info" | "warning" | "error",
  subject: string,
  body: string
) {
  if (!NOTIFICATION_EMAIL || !process.env.RESEND_API_KEY) return;

  const colors: Record<string, string> = {
    info: "#6366f1",
    warning: "#f59e0b",
    error: "#ef4444",
  };

  const icons: Record<string, string> = {
    info: "&#8505;&#65039;",
    warning: "&#9888;&#65039;",
    error: "&#10060;",
  };

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFICATION_EMAIL,
    subject: `${icons[level] || ""} ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #fafafa;">
        <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.06);">
          <div style="background: ${colors[level] || "#6366f1"}; padding: 24px 32px;">
            <h3 style="color: white; margin: 0; font-size: 16px; font-weight: 600;">${subject}</h3>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${body}</p>
          </div>
          <div style="padding: 12px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">Moments by Bibi</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
