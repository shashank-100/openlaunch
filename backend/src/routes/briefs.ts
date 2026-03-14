import { Router } from 'express';
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

export default router;
