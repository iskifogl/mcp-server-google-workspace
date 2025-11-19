# MCP Server - Google Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for Google Workspace integration, providing tools for Gmail, Google Calendar, and Google Drive access.

## Features

- 🔐 **Simple Authentication**: Environment variable based credentials
- 📧 **Gmail**: List, read, search, and send emails
- 📅 **Calendar**: List calendars (including shared), list and create events in any accessible calendar
- 📁 **Drive**: File management (coming soon)
- 🔄 **Auto Token Refresh**: Automatic OAuth token refresh
- 🏢 **Multi-User Support**: Host applications can decrypt and inject user-specific credentials
- 🤝 **Shared Calendar Support**: Access and manage events in calendars shared with you

## Installation

### For Individual Use

```bash
npm install mcp-server-google-workspace
# or
pnpm add mcp-server-google-workspace
```

### For Development

```bash
git clone <repo-url>
cd mcp-server-google-workspace
pnpm install
pnpm build
```

## Authentication

The MCP server reads Google OAuth credentials from environment variables:

```bash
# .env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_ACCESS_TOKEN=your_access_token  # optional
```

### Multi-User Platforms

For platforms serving multiple users, the host application should:
1. Fetch encrypted credentials from database
2. Decrypt credentials (e.g., using AWS KMS)
3. Pass decrypted credentials as environment variables when starting the MCP server

This keeps the MCP server simple and delegates credential management to the host application.

## Available Tools

### Gmail Tools

#### `gmail_list_emails`
List recent emails from Gmail inbox.

**Parameters:**
- `hours` (number, optional): Hours to look back (default: 24)
- `maxResults` (number, optional): Max emails to return (default: 50)
- `query` (string, optional): Gmail search query

**Example:**
```json
{
  "hours": 168,
  "maxResults": 50,
  "query": "from:boss@company.com"
}
```

#### `gmail_read_email`
Read full content of a specific email.

**Parameters:**
- `emailId` (string, required): Gmail message ID

#### `gmail_search_emails`
Search emails with Gmail query syntax.

**Parameters:**
- `query` (string, required): Search query
- `maxResults` (number, optional): Max results (default: 50)

**Query Examples:**
- `"from:user@example.com subject:meeting"`
- `"has:attachment after:2025/11/01"`
- `"is:unread label:important"`

### Calendar Tools

#### `calendar_list_calendars`
List all accessible calendars, including shared calendars.

**Parameters:**
- `showHidden` (boolean, optional): Include hidden calendars (default: false)
- `minAccessRole` (string, optional): Minimum access role filter (freeBusyReader, reader, writer, owner)

**Example:**
```json
{
  "showHidden": false,
  "minAccessRole": "reader"
}
```

**Response:**
Returns a list of calendars with their IDs, names, access roles, and other metadata. Use the calendar `id` field for other calendar operations.

#### `calendar_list_events`
List calendar events for a date range. Returns events with timezone information.

**Parameters:**
- `calendarId` (string, optional): Calendar ID (default: 'primary'). Use `calendar_list_calendars` to get IDs of shared calendars.
- `date` (string, optional): Start date (YYYY-MM-DD), default: today
- `days` (number, optional): Number of days (default: 1)
- `maxResults` (number, optional): Max events (default: 50)

**Response:**
Each event includes `startTimeZone` and `endTimeZone` fields, making it easy to handle events across different timezones (e.g., ET vs UTC).

#### `calendar_create_event`
Create a new calendar event with proper timezone support.

**Parameters:**
- `calendarId` (string, optional): Calendar ID (default: 'primary'). Use `calendar_list_calendars` to get IDs of shared calendars.
- `summary` (string, required): Event title
- `start` (string, required): Start time (ISO 8601)
- `end` (string, required): End time (ISO 8601)
- `timeZone` (string, optional): IANA timezone (e.g., "America/New_York", "America/Los_Angeles", "UTC"). If not specified, uses the calendar's default timezone.
- `description` (string, optional): Event description
- `location` (string, optional): Event location
- `attendees` (array, optional): Attendee emails

**Examples:**

Creating event in EST timezone:
```json
{
  "calendarId": "primary",
  "summary": "Team Meeting",
  "start": "2025-11-02T10:00:00",
  "end": "2025-11-02T11:00:00",
  "timeZone": "America/New_York",
  "description": "Quarterly review",
  "attendees": ["team@company.com"]
}
```

Creating event in UTC (default if not specified):
```json
{
  "summary": "Team Meeting",
  "start": "2025-11-02T15:00:00Z",
  "end": "2025-11-02T16:00:00Z"
}
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "mcp-server-google-workspace"],
      "env": {
        "GOOGLE_CLIENT_ID": "your_client_id",
        "GOOGLE_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

### Programmatic Usage (e.g., with Claude Agent SDK)

For multi-user platforms, decrypt credentials and inject them when starting the server:

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

// Your backend decrypts credentials from database
const credentials = await decryptUserCredentials(userId);

const agent = new Agent({
  mcpServers: [{
    command: 'node',
    args: ['path/to/mcp-server-google-workspace/dist/index.js'],
    env: {
      GOOGLE_CLIENT_ID: credentials.clientId,
      GOOGLE_CLIENT_SECRET: credentials.clientSecret,
      GOOGLE_REFRESH_TOKEN: credentials.refreshToken,
    }
  }]
});
```


## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm watch

# Run locally
pnpm dev
```

## Testing

### With MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### With Environment Variables

```bash
cp .env.example .env
# Edit .env with your credentials
pnpm dev
```

## OAuth Setup

To get Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI
6. Get client ID and client secret
7. Use OAuth playground to get refresh token

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

iskifogl
