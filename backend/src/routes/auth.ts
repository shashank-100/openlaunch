import { Router } from 'express';
import { supabase } from '../index';

const router = Router();

/**
 * POST /api/auth/signup
 * Create new user account
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, companyName } = req.body;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user!.id,
        email,
        full_name: fullName,
        company_name: companyName,
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create default organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: companyName || `${fullName}'s Team`,
        plan_tier: 'starter',
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add user to organization
    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'admin',
    });

    res.json({
      success: true,
      user,
      organization: org,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user profile + org
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', data.user.id)
      .single();

    res.json({
      success: true,
      user,
      organizationId: member?.organization_id || null,
      session: data.session,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

export default router;
