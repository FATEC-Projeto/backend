// src/config/mail.ts – Serviço de email abstrato (SES ou Resend)
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface MailDriver {
  send(opts: SendMailOptions): Promise<void>;
}

const DEFAULT_MAIL_FROM = "Suporte <no-reply@workflowfatec.com.br>";

// ---------- AWS SES ----------
class SESMailDriver implements MailDriver {
  private readonly client: SESClient;
  private readonly from: string;

  constructor(from: string) {
    this.from = from;
    this.client = new SESClient({
      region: process.env.AWS_SES_REGION || process.env.S3_REGION || "sa-east-1",
      ...(process.env.AWS_SES_ACCESS_KEY_ID && {
        credentials: {
          accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
        },
      }),
    });
  }

  async send({ to, subject, html }: SendMailOptions): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        Source: this.from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      }),
    );
  }
}

// ---------- Resend (fallback) ----------
class ResendMailDriver implements MailDriver {
  private readonly from: string;
  private readonly resend: {
    emails: { send: (payload: { from: string; to: string; subject: string; html: string }) => Promise<unknown> };
  };

  constructor(from: string) {
    this.from = from;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require("resend");
    this.resend = new Resend(process.env.RESEND_API_KEY!);
  }

  async send({ to, subject, html }: SendMailOptions): Promise<void> {
    await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
  }
}

// ---------- Factory ----------
let _instance: MailDriver | null = null;

export function getMailDriver(): MailDriver {
  if (_instance) return _instance;

  const driver = process.env.MAIL_DRIVER || "resend";
  const from =
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM ||
    DEFAULT_MAIL_FROM;

  if (driver === "ses") {
    _instance = new SESMailDriver(from);
  } else {
    _instance = new ResendMailDriver(from);
  }

  return _instance;
}
