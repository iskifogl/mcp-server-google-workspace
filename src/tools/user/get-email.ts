/**
 * Get the authenticated user's email address from environment
 */
export async function getUserEmail(): Promise<{ email: string }> {
  const email = process.env.GOOGLE_USER_EMAIL || '';

  if (!email) {
    throw new Error(
      'User email not found. GOOGLE_USER_EMAIL environment variable is not set.'
    );
  }

  return {
    email,
  };
}
