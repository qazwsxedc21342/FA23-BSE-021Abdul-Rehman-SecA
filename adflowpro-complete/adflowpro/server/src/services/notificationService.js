import supabase from '../db/supabase.js';

export const sendNotification = async ({ user_id, title, message, type = 'info', link = null }) => {
  try {
    await supabase.from('notifications').insert({ user_id, title, message, type, link });
  } catch (err) {
    console.error('[NOTIFICATION] Failed:', err.message);
  }
};

export const markAllRead = async (userId) => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
};
