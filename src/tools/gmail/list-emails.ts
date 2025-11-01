import { GoogleApiService } from '../../services/google-api.service.js';
import { EmailData } from '../../types/google.types.js';

export interface ListEmailsArgs {
  hours?: number;
  maxResults?: number;
  query?: string;
}

/**
 * List recent emails from Gmail inbox
 */
export async function listEmails(
  googleApi: GoogleApiService,
  args: ListEmailsArgs
): Promise<EmailData[]> {
  const {
    hours = 24,
    maxResults = 50,
    query: userQuery
  } = args;

  const gmail = await googleApi.getGmailClient();

  // Calculate timestamp for filtering
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const cutoffTimestamp = Math.floor(cutoffTime.getTime() / 1000);

  // Build Gmail search query
  let searchQuery = `after:${cutoffTimestamp}`;
  if (userQuery) {
    searchQuery += ` ${userQuery}`;
  } else {
    searchQuery += ` in:inbox`;
  }

  // List messages
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: searchQuery,
  });

  const messages = response.data.messages || [];

  if (messages.length === 0) {
    return [];
  }

  // Fetch full details for each message
  const emailPromises = messages.map(async (message) => {
    const fullMessage = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
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

    // Extract email body
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
      // Fallback to HTML
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

    body = body
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 5000);

    return {
      id: message.id!,
      from,
      to,
      subject,
      date,
      snippet,
      body,
      labels,
    };
  });

  const emails = await Promise.all(emailPromises);
  return emails;
}
