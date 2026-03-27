import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../db/supabase.js';
import { logAudit } from '../services/auditService.js';
import { getDemoModeInfo, isDemoMode } from '../utils/runtime.js';

const logAuthDisabled = (req) => {
  const demoInfo = getDemoModeInfo();
  const reason = demoInfo.forced ? 'DEMO_MODE=true' : (demoInfo.supabaseIssues.join(', ') || 'unknown');
  console.warn(`[AUTH] Blocked ${req.method} ${req.originalUrl} (${reason})`);
};

const authDisabledPayload = () => {
  const demoInfo = getDemoModeInfo();
  return {
    success: false,
    message: 'Auth is disabled until Supabase is configured. Update server/.env and run database/schema.sql.',
    details: {
      demoModeForced: demoInfo.forced,
      supabaseIssues: demoInfo.supabaseIssues,
    },
  };
};

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (isDemoMode()) {
      logAuthDisabled(req);
      const user = { id: 'demo-user-id', name, email, role: 'client', status: 'active', created_at: new Date().toISOString() };
      const token = signToken(user);
      return res.status(201).json({ success: true, message: 'Demo Mode: Account created', data: { user, token } });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash, role: 'client' })
      .select('id, name, email, role, status, created_at')
      .single();

    if (error) throw error;

    // Create seller profile
    await supabase.from('seller_profiles').insert({ user_id: user.id, display_name: name });

    await logAudit({ actor_id: user.id, action_type: 'USER_REGISTER', target_type: 'users', target_id: user.id });

    const token = signToken(user);
    res.status(201).json({ success: true, message: 'Account created', data: { user, token } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (isDemoMode()) {
      logAuthDisabled(req);
      
      // Determine role from email for demo testing
      let role = 'client';
      if (email.startsWith('admin')) role = 'admin';
      else if (email.startsWith('mod')) role = 'moderator';
      else if (email.startsWith('super')) role = 'superadmin';

      const user = { id: `demo-${role}-id`, name: email.split('@')[0], email, role, status: 'active' };
      const token = signToken(user);
      return res.json({ success: true, message: 'Demo Mode: Login successful', data: { user, token } });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is suspended or banned' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    await logAudit({ actor_id: user.id, action_type: 'USER_LOGIN', target_type: 'users', target_id: user.id, ip_address: req.ip });

    const { password_hash: _, ...safeUser } = user;
    const token = signToken(safeUser);
    res.json({ success: true, message: 'Login successful', data: { user: safeUser, token } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  if (isDemoMode()) {
    return res.json({ 
      success: true, 
      data: { 
        user: req.user, 
        profile: { user_id: req.user.id, display_name: req.user.name, is_verified: true } 
      } 
    });
  }

  const { data: profile } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  res.json({ success: true, data: { user: req.user, profile } });
};
