import { Router } from 'express';
import { supabase, researchQueue } from '../index';

const router = Router();
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ accounts: data });
});

router.post('/', async (req, res) => {
  const { companyName, domain } = req.body;
  if (!companyName) return res.status(400).json({ error: 'companyName required' });
  const { data, error } = await supabase
    .from('accounts')
    .insert({ user_id: DEMO_USER_ID, company_name: companyName, domain: domain || null })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ account: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', DEMO_USER_ID);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.post('/:id/scan', async (req, res) => {
  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !account) return res.status(404).json({ error: 'Account not found' });
  await researchQueue.add('monitor', {
    companyName: account.company_name,
    domain: account.domain || '',
    accountId: account.id,
  }, { removeOnComplete: true });
  res.json({ success: true, queued: true });
});

export default router;
