import { env } from '../config/env';

export interface InviteEmailPayload {
  to: string;
  displayName: string;
  roleLabel: string;
  loginUrl: string;
  temporaryPassword?: string;
}

export interface InviteEmailResult {
  sent: boolean;
  provider: 'resend' | 'manual';
  subject: string;
  body: string;
  mailtoUrl: string;
}

function buildMailto(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildInviteEmail(payload: InviteEmailPayload) {
  const subject = 'Thong tin dang nhap Bep Nha Minh';
  const passwordLine = payload.temporaryPassword
    ? `Mat khau tam thoi: ${payload.temporaryPassword}`
    : 'Mat khau: quan ly se cung cap rieng hoac dat lai mat khau cho ban.';

  const body = [
    `Xin chao ${payload.displayName},`,
    '',
    'Ban da duoc tao tai khoan nhan vien tren he thong Bep Nha Minh.',
    `Vai tro: ${payload.roleLabel}`,
    `Email dang nhap: ${payload.to}`,
    passwordLine,
    '',
    `Dang nhap tai: ${payload.loginUrl}`,
    '',
    'Vui long doi mat khau sau lan dang nhap dau tien.',
  ].join('\n');

  return {
    subject,
    body,
    mailtoUrl: buildMailto(payload.to, subject, body),
  };
}

export async function sendInviteEmail(payload: InviteEmailPayload): Promise<InviteEmailResult> {
  const email = buildInviteEmail(payload);

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return {
      sent: false,
      provider: 'manual',
      ...email,
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [payload.to],
      subject: email.subject,
      text: email.body,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Resend returned ${response.status}`);
  }

  return {
    sent: true,
    provider: 'resend',
    ...email,
  };
}
