import { Router } from 'express';
import supabase from '../db/supabase.js';

export const questionRouter = Router();
export const healthRouter = Router();

// GET /api/questions/random
questionRouter.get('/random', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('learning_questions')
      .select('id, question, answer, topic, difficulty')
      .eq('is_active', true);
    if (error) throw error;
    if (!data.length) return res.json({ success: true, data: null });
    const random = data[Math.floor(Math.random() * data.length)];
    res.json({ success: true, data: random });
  } catch (err) { next(err); }
});

// GET /api/health/db
healthRouter.get('/db', async (req, res, next) => {
  const start = Date.now();
  try {
    const { error } = await supabase.from('system_health_logs').select('id').limit(1);
    const ms     = Date.now() - start;
    const status = error ? 'error' : 'ok';

    await supabase.from('system_health_logs').insert({
      source: 'api_health_check', response_ms: ms, status,
      message: error ? error.message : 'Database reachable',
    });

    res.json({ success: true, data: { status, response_ms: ms, checked_at: new Date().toISOString() } });
  } catch (err) { next(err); }
});
