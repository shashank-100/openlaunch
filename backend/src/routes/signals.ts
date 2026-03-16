import { Router } from 'express';
import { supabase } from '../index';

const router = Router();

// GET /api/signals — feed of all signals across all accounts
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const type = req.query.type as string;

  let query = supabase
    .from('signals')
    .select(`*, accounts(id, company_name, domain)`)
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (type && type !== 'all') query = query.eq('signal_type', type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Mark signals as seen
  const newIds = (data || []).filter(s => s.is_new).map(s => s.id);
  if (newIds.length) {
    await supabase.from('signals').update({ is_new: false }).in('id', newIds);
  }

  res.json({ signals: data });
});

// GET /api/signals/unread-count
router.get('/unread-count', async (req, res) => {
  const { count, error } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })
    .eq('is_new', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ count: count || 0 });
});

// GET /api/signals/:id — single signal with brief (if exists)
router.get('/:id', async (req, res) => {
  const { data: signal, error } = await supabase
    .from('signals')
    .select(`*, accounts(id, company_name, domain)`)
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Signal not found' });

  const { data: brief } = await supabase
    .from('briefs')
    .select('*')
    .eq('signal_id', req.params.id)
    .single();

  res.json({ signal, brief: brief || null });
});

export default router;
