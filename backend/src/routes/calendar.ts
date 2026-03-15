import { Router } from 'express';
import { google } from 'googleapis';
import { supabase, researchQueue } from '../index';

const router = Router();

// Registry of active polling intervals — prevents duplicate loops on reconnect
const calendarIntervals = new Map<string, NodeJS.Timeout>();

/**
 * GET /api/calendar/connect/google
 * Initiate Google Calendar OAuth flow
 */
router.get('/connect/google', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId as string,
  });

  res.redirect(authUrl);
});

/**
 * GET /api/calendar/callback/google
 * Handle Google OAuth callback
 */
router.get('/callback/google', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or userId' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code as string);

    // Save tokens to database
    const { error } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        is_active: true,
      });

    if (error) throw error;

    // Start watching calendar for events
    await startCalendarWatch(userId as string);

    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_connected=true`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=calendar_connection_failed`);
  }
});

/**
 * POST /api/calendar/sync/:userId
 * Manually sync calendar and trigger research for upcoming meetings
 */
router.post('/sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get calendar connection
    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !connection) {
      return res.status(404).json({ error: 'No active calendar connection found' });
    }

    // Get upcoming meetings
    const meetings = await getUpcomingMeetings(connection);

    // Filter external meetings (ignore internal)
    const externalMeetings = meetings.filter(meeting =>
      meeting.attendees.some((a: any) => !isInternalEmail(a.email))
    );

    // Trigger research jobs for meetings in the next 2 hours
    const jobsCreated = [];
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    for (const meeting of externalMeetings) {
      const meetingTime = new Date(meeting.startTime);

      // Only trigger if meeting is within 30-120 minutes
      if (meetingTime > now && meetingTime < twoHoursFromNow) {
        // Extract company and contact from attendees
        const externalAttendee = meeting.attendees.find((a: any) => !isInternalEmail(a.email));

        if (externalAttendee) {
          const companyName = extractCompanyFromEmail(externalAttendee.email);
          const contactName = externalAttendee.name || externalAttendee.email.split('@')[0];

          // Check if job already exists
          const { data: existingJob } = await supabase
            .from('research_jobs')
            .select('id')
            .eq('meeting_id', meeting.id)
            .eq('user_id', userId)
            .single();

          if (!existingJob) {
            // Create research job
            const job = await researchQueue.add('research', {
              companyName,
              contactName,
              contactEmail: externalAttendee.email,
              meetingTime: meetingTime.toISOString(),
              userId,
              organizationId: req.body.organizationId,
              meetingId: meeting.id,
              priority: 7,
            });

            jobsCreated.push({
              jobId: job.id,
              companyName,
              contactName,
              meetingTime,
            });
          }
        }
      }
    }

    res.json({
      success: true,
      meetingsFound: externalMeetings.length,
      jobsCreated: jobsCreated.length,
      jobs: jobsCreated,
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

/**
 * Get upcoming meetings from Google Calendar
 */
async function getUpcomingMeetings(connection: any): Promise<any[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: tomorrow.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  return events.map(event => ({
    id: event.id,
    summary: event.summary,
    description: event.description,
    startTime: event.start?.dateTime || event.start?.date,
    endTime: event.end?.dateTime || event.end?.date,
    attendees: (event.attendees || []).map(a => ({
      email: a.email!,
      name: a.displayName,
      responseStatus: a.responseStatus,
    })),
    organizerEmail: event.organizer?.email,
  }));
}

/**
 * Start watching calendar for new events
 */
async function startCalendarWatch(userId: string): Promise<void> {
  // Clear any existing interval for this user before starting a new one
  const existing = calendarIntervals.get(userId);
  if (existing) {
    clearInterval(existing);
    console.log(`📅 Restarting calendar polling for user ${userId}`);
  } else {
    console.log(`📅 Calendar polling started for user ${userId}`);
  }

  // Poll immediately, then every 5 minutes
  await pollCalendarForUser(userId);
  const interval = setInterval(() => pollCalendarForUser(userId), 5 * 60 * 1000);
  calendarIntervals.set(userId, interval);
}

async function pollCalendarForUser(userId: string): Promise<void> {
  try {
    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!connection) return;

    const meetings = await getUpcomingMeetings(connection);
    const now = new Date();
    const window = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const meeting of meetings) {
      const meetingTime = new Date(meeting.startTime);
      if (meetingTime <= now || meetingTime > window) continue;

      const externalAttendee = meeting.attendees.find((a: any) => !isInternalEmail(a.email));
      if (!externalAttendee) continue;

      const { data: existing } = await supabase
        .from('research_jobs')
        .select('id')
        .eq('meeting_id', meeting.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) continue;

      const companyName = extractCompanyFromEmail(externalAttendee.email);
      const contactName = externalAttendee.name || externalAttendee.email.split('@')[0];

      await researchQueue.add('research', {
        companyName,
        contactName,
        contactEmail: externalAttendee.email,
        meetingTime: meetingTime.toISOString(),
        userId,
        organizationId: '00000000-0000-0000-0000-000000000002',
        meetingId: meeting.id,
        priority: 8,
      });

      console.log(`📅 Auto-queued: ${companyName} / ${contactName} for ${meetingTime.toLocaleString()}`);
    }
  } catch (error: any) {
    console.error(`Calendar poll failed for ${userId}:`, error.message);
  }
}

/**
 * Helper: Check if email is internal
 * Currently skipped — all meetings trigger research, user filters manually
 */
function isInternalEmail(_email: string): boolean {
  return false;
}

/**
 * Helper: Extract company name from email domain
 */
function extractCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1];
  const companyName = domain.split('.')[0];
  return companyName.charAt(0).toUpperCase() + companyName.slice(1);
}

export default router;
