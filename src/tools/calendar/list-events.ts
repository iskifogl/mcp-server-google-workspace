import { GoogleApiService } from '../../services/google-api.service.js';
import { CalendarEvent } from '../../types/google.types.js';

export interface ListEventsArgs {
  calendarId?: string; // Calendar ID (default: 'primary')
  date?: string; // ISO date string (YYYY-MM-DD)
  days?: number; // Number of days from date (default: 1)
  maxResults?: number;
}

/**
 * List calendar events
 */
export async function listEvents(
  googleApi: GoogleApiService,
  args: ListEventsArgs
): Promise<CalendarEvent[]> {
  const {
    calendarId = 'primary',
    date,
    days = 1,
    maxResults = 50
  } = args;

  const calendar = await googleApi.getCalendarClient();

  // Calculate time range
  let timeMin: Date;
  let timeMax: Date;

  if (date) {
    timeMin = new Date(date);
    timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + days);
  } else {
    // Default: today
    timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0);
    timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + days);
  }

  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  return events.map((event) => ({
    id: event.id!,
    summary: event.summary || 'No title',
    description: event.description || undefined,
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    location: event.location || undefined,
    attendees: event.attendees?.map(a => a.email!).filter(Boolean) || undefined,
    status: event.status || 'confirmed',
  }));
}
