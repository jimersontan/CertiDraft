export const SENDGRID_CONFIG_ERROR =
  "SendGrid is not configured. Add SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to continue.";

export type SendGridMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachmentFilename?: string;
  attachmentBase64?: string;
};

export function hasSendGridEnv() {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
}

export async function sendSendGridEmail(message: SendGridMessage) {
  if (!hasSendGridEnv()) {
    throw new Error(SENDGRID_CONFIG_ERROR);
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: message.to }],
          subject: message.subject,
        },
      ],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME || "CertiDraft",
      },
      content: [
        {
          type: "text/plain",
          value: message.text,
        },
        {
          type: "text/html",
          value: message.html,
        },
      ],
      attachments:
        message.attachmentFilename && message.attachmentBase64
          ? [
              {
                content: message.attachmentBase64,
                filename: message.attachmentFilename,
                type: "application/pdf",
                disposition: "attachment",
              },
            ]
          : undefined,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SendGrid request failed (${response.status}): ${detail}`);
  }
}
