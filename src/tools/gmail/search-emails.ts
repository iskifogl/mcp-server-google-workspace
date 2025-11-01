import { GoogleApiService } from '../../services/google-api.service.js';
import { listEmails, ListEmailsArgs } from './list-emails.js';

export interface SearchEmailsArgs {
  query: string;
  maxResults?: number;
}

/**
 * Search emails with Gmail query syntax
 *
 * Examples:
 * - "from:user@example.com"
 * - "subject:meeting has:attachment"
 * - "is:unread after:2025/11/01"
 */
export async function searchEmails(
  googleApi: GoogleApiService,
  args: SearchEmailsArgs
) {
  const { query, maxResults = 50 } = args;

  // Use list-emails with custom query
  return listEmails(googleApi, {
    query,
    maxResults,
    hours: 8760, // Search last year (365 days)
  });
}
