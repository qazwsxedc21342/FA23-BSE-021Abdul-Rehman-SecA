import { Router } from 'express';
import supabase from '../db/supabase.js';

export const categoryRouter = Router();
export const cityRouter = Router();

categoryRouter.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

cityRouter.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('cities').select('*').eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
});
