#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';

import { AuthProvider } from './auth/auth-provider.js';
import { GoogleApiService } from './services/google-api.service.js';
import { listEmails } from './tools/gmail/list-emails.js';
import { readEmail } from './tools/gmail/read-email.js';
import { searchEmails } from './tools/gmail/search-emails.js';
import { sendEmail } from './tools/gmail/send-email.js';
import { listCalendars } from './tools/calendar/list-calendars.js';
import { listEvents } from './tools/calendar/list-events.js';
import { createEvent } from './tools/calendar/create-event.js';
import { getUserEmail } from './tools/user/get-email.js';

// Load environment variables
config();

// Initialize services
const authProvider = new AuthProvider();
const googleApi = new GoogleApiService(authProvider);

// Create MCP server
const server = new Server(
  {
    name: 'mcp-server-google-workspace',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'gmail_list_emails',
        description: 'List recent emails from Gmail inbox with optional filtering. Returns email metadata and content.',
        inputSchema: {
          type: 'object',
          properties: {
            hours: {
              type: 'number',
              description: 'Number of hours to look back (default: 24)',
              default: 24,
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of emails to return (default: 50, max: 100)',
              default: 50,
            },
            query: {
              type: 'string',
              description: 'Gmail search query (e.g., "from:user@example.com", "has:attachment", "is:unread")',
            },
          },
        },
      },
      {
        name: 'gmail_read_email',
        description: 'Read the full content of a specific email by ID',
        inputSchema: {
          type: 'object',
          properties: {
            emailId: {
              type: 'string',
              description: 'The Gmail message ID',
            },
          },
          required: ['emailId'],
        },
      },
      {
        name: 'gmail_search_emails',
        description: 'Search emails using Gmail query syntax. Supports complex queries with operators like from:, to:, subject:, has:, is:, after:, before:',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Gmail search query (e.g., "from:boss@company.com subject:urgent", "has:attachment after:2025/11/01")',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
              default: 50,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'gmail_send_email',
        description: 'Send an email via Gmail with subject, body, and recipients',
        inputSchema: {
          type: 'object',
          properties: {
            to: {
              type: ['string', 'array'],
              description: 'Recipient email address(es). Can be a single email or array of emails. Use "me" to send to yourself.',
              items: { type: 'string' },
            },
            subject: {
              type: 'string',
              description: 'Email subject line',
            },
            body: {
              type: 'string',
              description: 'Email body content (plain text or HTML)',
            },
            cc: {
              type: ['string', 'array'],
              description: 'CC recipient(s) (optional)',
              items: { type: 'string' },
            },
            bcc: {
              type: ['string', 'array'],
              description: 'BCC recipient(s) (optional)',
              items: { type: 'string' },
            },
            isHtml: {
              type: 'boolean',
              description: 'Whether the body is HTML formatted (default: false)',
              default: false,
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },
      {
        name: 'calendar_list_calendars',
        description: 'List all accessible calendars including shared calendars. Use this to get calendar IDs for other calendar operations.',
        inputSchema: {
          type: 'object',
          properties: {
            showHidden: {
              type: 'boolean',
              description: 'Include hidden calendars (default: false)',
              default: false,
            },
            minAccessRole: {
              type: 'string',
              description: 'Minimum access role filter (freeBusyReader, reader, writer, owner)',
              enum: ['freeBusyReader', 'reader', 'writer', 'owner'],
            },
          },
        },
      },
      {
        name: 'calendar_list_events',
        description: 'List calendar events for a specific date range. Can list events from any accessible calendar.',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary" for your main calendar). Use calendar_list_calendars to get IDs of shared calendars.',
              default: 'primary',
            },
            date: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format (default: today)',
            },
            days: {
              type: 'number',
              description: 'Number of days from start date (default: 1)',
              default: 1,
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of events (default: 50)',
              default: 50,
            },
          },
        },
      },
      {
        name: 'calendar_create_event',
        description: 'Create a new calendar event with title, time, and optional details. Can create events in any writable calendar.',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary" for your main calendar). Use calendar_list_calendars to get IDs of shared calendars.',
              default: 'primary',
            },
            summary: {
              type: 'string',
              description: 'Event title/summary',
            },
            start: {
              type: 'string',
              description: 'Start time in ISO 8601 format (e.g., "2025-11-02T10:00:00Z")',
            },
            end: {
              type: 'string',
              description: 'End time in ISO 8601 format (e.g., "2025-11-02T11:00:00Z")',
            },
            description: {
              type: 'string',
              description: 'Event description (optional)',
            },
            location: {
              type: 'string',
              description: 'Event location (optional)',
            },
            attendees: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of attendee email addresses (optional)',
            },
          },
          required: ['summary', 'start', 'end'],
        },
      },
      {
        name: 'get_user_email',
        description: 'Get the authenticated user\'s email address',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'gmail_list_emails': {
        const result = await listEmails(googleApi, request.params.arguments as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'gmail_read_email': {
        const result = await readEmail(googleApi, request.params.arguments as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'gmail_search_emails': {
        const result = await searchEmails(googleApi, request.params.arguments as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'gmail_send_email': {
        const result = await sendEmail(googleApi, request.params.arguments as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'calendar_list_calendars': {
        const result = await listCalendars(googleApi, request.params.arguments as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'calendar_list_events': {
        const result = await listEvents(googleApi, request.params.arguments as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'calendar_create_event': {
        const result = await createEvent(googleApi, request.params.arguments as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_user_email': {
        const result = await getUserEmail();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server Google Workspace started on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
