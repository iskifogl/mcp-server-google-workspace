import { GoogleApiService } from '../../services/google-api.service.js';

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  isHtml?: boolean;
}

/**
 * Send an email via Gmail
 */
export async function sendEmail(
  googleApi: GoogleApiService,
  args: SendEmailArgs
): Promise<{ success: boolean; messageId: string }> {
  const { to, subject, body, cc, bcc, isHtml = false } = args;

  const gmail = await googleApi.getGmailClient();

  // If "me" is specified, get the authenticated user's email
  let toAddresses = Array.isArray(to) ? to.join(', ') : to;
  if (toAddresses === 'me' || toAddresses.includes('me')) {
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const userEmail = profile.data.emailAddress!;
    toAddresses = toAddresses.replace(/\bme\b/g, userEmail);
  }

  const ccAddresses = cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : '';
  const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : '';

  const contentType = isHtml ? 'text/html' : 'text/plain';

  let email = [
    `To: ${toAddresses}`,
    cc ? `Cc: ${ccAddresses}` : '',
    bcc ? `Bcc: ${bccAddresses}` : '',
    `Subject: ${subject}`,
    `Content-Type: ${contentType}; charset=UTF-8`,
    '',
    body,
  ]
    .filter(Boolean)
    .join('\n');

  // Base64url encode the email
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });

  return {
    success: true,
    messageId: response.data.id!,
  };
}
