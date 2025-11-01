import { GoogleApiService } from '../../services/google-api.service.js';
import { EmailData } from '../../types/google.types.js';

export interface ReadEmailArgs {
  emailId: string;
}

/**
 * Read a specific email by ID
 */
export async function readEmail(
  googleApi: GoogleApiService,
  args: ReadEmailArgs
): Promise<EmailData> {
  const { emailId } = args;

  const gmail = await googleApi.getGmailClient();

  const fullMessage = await gmail.users.messages.get({
    userId: 'me',
    id: emailId,
    format: 'full',
  });

  const headers = fullMessage.data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value || '';

  const from = getHeader('From');
  const to = getHeader('To');
  const subject = getHeader('Subject');
  const date = getHeader('Date');
  const snippet = fullMessage.data.snippet || '';
  const labels = fullMessage.data.labelIds || [];

  // Extract full email body
  let body = '';
  const payload = fullMessage.data.payload;

  const extractBody = (parts: any[]): string => {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.parts) {
        const nested = extractBody(part.parts);
        if (nested) return nested;
      }
    }
    for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
        return html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
    return '';
  };

  if (payload) {
    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      body = extractBody(payload.parts);
    }
  }

  body = body.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return {
    id: emailId,
    from,
    to,
    subject,
    date,
    snippet,
    body,
    labels,
  };
}
