import { Router } from 'express';
import { Resend } from 'resend';
import { supabase } from '../index';

const router = Router();
// Resend initialized lazily so missing key doesn't crash on startup
function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder');
}

// POST /api/outreach/send
router.post('/send', async (req, res) => {
  const { signalId, toEmail, subject, body } = req.body;
  if (!signalId || !toEmail || !subject || !body) {
    return res.status(400).json({ error: 'signalId, toEmail, subject, body required' });
  }

  try {
    const { data: signal } = await supabase
      .from('signals')
      .select('account_id')
      .eq('id', signalId)
      .single();

    const { data: sent, error: sendErr } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'outreach@geodo.ai',
      to: toEmail,
      subject,
      text: body,
    });

    if (sendErr) throw sendErr;

    await supabase.from('outreach').insert({
      signal_id: signalId,
      account_id: signal?.account_id,
      to_email: toEmail,
      subject,
      body,
      status: 'sent',
    });

    res.json({ success: true, emailId: sent?.id });
  } catch (err: any) {
    console.error('Send email error:', err.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// GET /api/outreach — history of sent emails
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('outreach')
    .select(`*, accounts(company_name), signals(signal_summary)`)
    .order('sent_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ outreach: data });
});

export default router;
