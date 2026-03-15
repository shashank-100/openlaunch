import { Router } from 'express';
import axios from 'axios';
import { supabase } from '../index';

const router = Router();

/**
 * GET /api/briefs
 * Get all briefs for a user
 */
router.get('/', async (req, res) => {
  try {
    const { userId, organizationId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const query = supabase
      .from('briefs')
      .select(`
        *,
        research_jobs (
          id,
          meeting_time,
          status,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (organizationId) {
      query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, briefs: data });
  } catch (error) {
    console.error('Get briefs error:', error);
    res.status(500).json({ error: 'Failed to fetch briefs' });
  }
});

/**
 * GET /api/briefs/:briefId
 * Get a specific brief with agent logs
 */
router.get('/:briefId', async (req, res) => {
  try {
    const { briefId } = req.params;

    // Get brief
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) throw briefError;

    // Get agent logs for replay
    const { data: logs, error: logsError } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('brief_id', briefId)
      .order('timestamp', { ascending: true });

    if (logsError) throw logsError;

    // Get signals
    const { data: signals, error: signalsError } = await supabase
      .from('signals')
      .select('*')
      .eq('brief_id', briefId)
      .order('importance_score', { ascending: false });

    if (signalsError) throw signalsError;

    res.json({
      success: true,
      brief: {
        ...brief,
        agentLogs: logs,
        signals,
      },
    });
  } catch (error) {
    console.error('Get brief error:', error);
    res.status(500).json({ error: 'Failed to fetch brief' });
  }
});

/**
 * POST /api/briefs/:briefId/rate
 * Rate a brief (feedback loop)
 */
router.post('/:briefId/rate', async (req, res) => {
  try {
    const { briefId } = req.params;
    const { userId, rating, feedbackText } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ error: 'userId and rating are required' });
    }

    const { data, error } = await supabase
      .from('brief_ratings')
      .upsert({
        brief_id: briefId,
        user_id: userId,
        rating,
        feedback_text: feedbackText,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, rating: data });
  } catch (error) {
    console.error('Rate brief error:', error);
    res.status(500).json({ error: 'Failed to rate brief' });
  }
});

/**
 * POST /api/briefs/:briefId/buyer-asset
 * Generate a buyer-facing one-pager from the brief
 */
router.post('/:briefId/buyer-asset', async (req, res) => {
  try {
    const { briefId } = req.params;
    const { meetingNotes } = req.body;

    const { data: brief, error } = await supabase
      .from('briefs')
      .select('company_name, contact_name, full_brief_markdown')
      .eq('id', briefId)
      .single();

    if (error || !brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    const prompt = `You are a world-class solution engineer. A sales call just ended.
Your job is to create a personalized one-pager FOR THE BUYER — not for the seller.
This is what the buyer will share internally to get buy-in.

**Company researched:** ${brief.company_name}
**Contact:** ${brief.contact_name || 'Unknown'}

**Research brief:**
${(brief.full_brief_markdown || '').substring(0, 3000)}

**Meeting notes (if any):**
${meetingNotes || 'No notes provided.'}

Create a buyer-facing one-pager with exactly these sections:

## Why This Matters To You
- 2-3 bullets specific to their company's situation
- Reference their actual signals (hiring, funding, tech gaps)
- Connect to their stated priorities

## What You Get
- Concrete outcomes, not features
- Specific to their use case
- Numbers where possible ("save X hours", "close Y% faster")

## Your ROI Case
- Simple math they can take to their CFO
- Conservative estimate
- Payback period

## Next Steps
- Clear, time-boxed actions
- Who owns what
- Decision criteria

**Rules:**
- Write as if Intake is presenting to their team (not your team)
- Use "you/your" not "we/our"
- No sales language — this is a decision-support document
- Be specific to their company, not generic
- 1 page max

Generate the buyer asset now.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        max_completion_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const markdown = response.data.choices[0]?.message?.content || '';
    res.json({ success: true, markdown });
  } catch (error) {
    console.error('Buyer asset error:', error);
    res.status(500).json({ error: 'Failed to generate buyer asset' });
  }
});

export default router;
