import { google } from 'googleapis';
import { AuthProvider } from '../auth/auth-provider.js';

/**
 * Google API Service
 *
 * Manages OAuth2 client and provides access to Google APIs
 */
export class GoogleApiService {
  private oauth2Client: any = null;

  constructor(private authProvider: AuthProvider) {}

  /**
   * Get or create OAuth2 client
   */
  async getOAuth2Client() {
    if (this.oauth2Client) {
      return this.oauth2Client;
    }

    const credentials = await this.authProvider.getCredentials();

    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    this.oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
      access_token: credentials.accessToken,
    });

    // Handle token refresh automatically
    this.oauth2Client.on('tokens', (tokens: any) => {
      if (tokens.access_token) {
        console.error('[Google API] Access token refreshed');
      }
    });

    return this.oauth2Client;
  }

  /**
   * Get Gmail API client
   */
  async getGmailClient() {
    const auth = await this.getOAuth2Client();
    return google.gmail({ version: 'v1', auth });
  }

  /**
   * Get Calendar API client
   */
  async getCalendarClient() {
    const auth = await this.getOAuth2Client();
    return google.calendar({ version: 'v3', auth });
  }

  /**
   * Get Drive API client
   */
  async getDriveClient() {
    const auth = await this.getOAuth2Client();
    return google.drive({ version: 'v3', auth });
  }
}
