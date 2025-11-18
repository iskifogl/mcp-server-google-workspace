import { GoogleApiService } from '../../services/google-api.service.js';
import { CalendarInfo } from '../../types/google.types.js';

export interface ListCalendarsArgs {
  showHidden?: boolean; // Include hidden calendars (default: false)
  minAccessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner'; // Minimum access role
}

/**
 * List all calendars accessible to the user, including shared calendars
 */
export async function listCalendars(
  googleApi: GoogleApiService,
  args: ListCalendarsArgs = {}
): Promise<CalendarInfo[]> {
  const {
    showHidden = false,
    minAccessRole
  } = args;

  const calendar = await googleApi.getCalendarClient();

  const response = await calendar.calendarList.list({
    showHidden,
    minAccessRole,
  });

  const calendars = response.data.items || [];

  return calendars.map((cal) => ({
    id: cal.id!,
    summary: cal.summary || 'No title',
    description: cal.description || undefined,
    primary: cal.primary || false,
    accessRole: cal.accessRole || 'reader',
    backgroundColor: cal.backgroundColor || undefined,
    foregroundColor: cal.foregroundColor || undefined,
    timeZone: cal.timeZone || undefined,
  }));
}
