import { Router } from 'express';
import supabase from '../db/supabase.js';
import { isDemoMode } from '../utils/runtime.js';

const router = Router();

router.get('/random', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        data: {
          id: 'demo-q-1',
          topic: 'Marketplace Basics',
          difficulty: 'easy',
          question: 'Why does AdFlow Pro only show ads with status "published"?',
          answer: 'Because only approved and active listings should be visible publicly. Other statuses represent drafts, pending review/payment, or expired ads.',
        },
      });
    }

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

export default router;
