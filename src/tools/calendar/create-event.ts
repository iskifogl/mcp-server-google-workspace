import { GoogleApiService } from '../../services/google-api.service.js';
import { CalendarEvent } from '../../types/google.types.js';

export interface CreateEventArgs {
  calendarId?: string; // Calendar ID (default: 'primary')
  summary: string;
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  timeZone?: string; // IANA timezone (e.g., 'America/New_York', 'UTC'). If not specified, uses the calendar's default timezone
  description?: string;
  location?: string;
  attendees?: string[]; // Array of email addresses
}

/**
 * Create a new calendar event
 */
export async function createEvent(
  googleApi: GoogleApiService,
  args: CreateEventArgs
): Promise<CalendarEvent> {
  const {
    calendarId = 'primary',
    summary,
    start,
    end,
    timeZone,
    description,
    location,
    attendees
  } = args;

  const calendar = await googleApi.getCalendarClient();

  const event = {
    summary,
    description,
    location,
    start: {
      dateTime: start,
      ...(timeZone && { timeZone }),
    },
    end: {
      dateTime: end,
      ...(timeZone && { timeZone }),
    },
    attendees: attendees?.map(email => ({ email })),
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  const createdEvent = response.data;

  return {
    id: createdEvent.id!,
    summary: createdEvent.summary || summary,
    description: createdEvent.description || description,
    start: createdEvent.start?.dateTime || start,
    end: createdEvent.end?.dateTime || end,
    startTimeZone: createdEvent.start?.timeZone || undefined,
    endTimeZone: createdEvent.end?.timeZone || undefined,
    location: createdEvent.location || location,
    attendees: createdEvent.attendees?.map(a => a.email!).filter(Boolean),
    status: createdEvent.status || 'confirmed',
  };
}
