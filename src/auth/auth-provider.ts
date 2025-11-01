import { GoogleCredentials } from '../types/google.types.js';

/**
 * Auth Provider
 *
 * Loads Google OAuth credentials from environment variables.
 * These credentials should be provided by the host application when starting the MCP server.
 *
 * Required ENV vars:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN
 * - GOOGLE_ACCESS_TOKEN (optional)
 */
export class AuthProvider {
  async getCredentials(): Promise<GoogleCredentials> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN'
      );
    }

    return {
      clientId,
      clientSecret,
      refreshToken,
      accessToken,
    };
  }
}
