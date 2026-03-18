import { Router } from 'express';
import axios from 'axios';
import { supabase } from '../index';

const router = Router();

// GET /api/briefs/:id — get brief (generate if not exists)
router.get('/:id', async (req, res) => {
  try {
    // Check if brief already exists
    const { data: existing } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (existing) return res.json({ brief: existing });

    // No brief by brief ID — try treating it as a signal ID
    const { data: signal, error: sigErr } = await supabase
      .from('signals')
      .select(`*, accounts(id, company_name, domain)`)
      .eq('id', req.params.id)
      .single();

    if (sigErr || !signal) return res.status(404).json({ error: 'Not found' });

    // Check if brief already exists for this signal
    const { data: existing2 } = await supabase
      .from('briefs')
      .select('*')
      .eq('signal_id', signal.id)
      .single();

    if (existing2) return res.json({ brief: existing2 });

    // Generate brief via GPT
    const companyName = signal.accounts?.company_name || 'Unknown Company';
    const prompt = `You are a B2B sales expert. Generate a sales brief in exactly 5 sections.

Company: ${companyName}
Signal: ${signal.signal_summary}
Pain Point: ${signal.pain_point}
Outreach Angle: ${signal.outreach_angle}
Email Subject: ${signal.email_subject}
Email Body: ${signal.email_body}

Return JSON:
{
  "what_they_do": "2 sentences max — what this company does and who they serve",
  "the_signal": "What just happened and why it matters right now",
  "the_pain": "What this signal reveals they are struggling with internally",
  "your_angle": "Exactly how to position your pitch for this specific moment",
  "the_email": "Subject: ${signal.email_subject}\\n\\n${signal.email_body}"
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-5-mini-2025-08-07',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const parsed = JSON.parse(response.data.choices[0].message.content);

    const { data: brief, error: insertErr } = await supabase
      .from('briefs')
      .insert({
        signal_id: signal.id,
        account_id: signal.account_id,
        what_they_do: parsed.what_they_do,
        the_signal: parsed.the_signal,
        the_pain: parsed.the_pain,
        your_angle: parsed.your_angle,
        the_email: parsed.the_email,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    res.json({ brief });
  } catch (err: any) {
    console.error('Brief error:', err.message);
    res.status(500).json({ error: 'Failed to generate brief' });
  }
});

export default router;
