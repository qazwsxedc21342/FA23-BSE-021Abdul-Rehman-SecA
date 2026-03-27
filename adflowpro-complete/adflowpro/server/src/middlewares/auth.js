import jwt from 'jsonwebtoken';
import supabase from '../db/supabase.js';

// ─── Verify JWT token ────────────────────────────────────────
export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (String(decoded.id).startsWith('demo-')) {
      req.user = { id: decoded.id, name: decoded.email.split('@')[0], email: decoded.email, role: decoded.role, status: 'active' };
      return next();
    }

    // Fetch fresh user from DB to catch suspensions
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, status')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account suspended or banned' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─── Role-based access control factory ──────────────────────
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}`,
    });
  }
  next();
};

// ─── Cron secret check ──────────────────────────────────────
export const verifyCronSecret = (req, res, next) => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ success: false, message: 'Invalid cron secret' });
  }
  next();
};
