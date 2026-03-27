import supabase from '../db/supabase.js';

/**
 * Write to audit_logs table.
 * Non-blocking — failures are logged but don't break the request.
 */
export const logAudit = async ({
  actor_id,
  action_type,
  target_type = null,
  target_id   = null,
  old_value   = null,
  new_value   = null,
  ip_address  = null,
}) => {
  try {
    await supabase.from('audit_logs').insert({
      actor_id, action_type, target_type, target_id,
      old_value, new_value, ip_address,
    });
  } catch (err) {
    console.error('[AUDIT] Failed to write audit log:', err.message);
  }
};

/**
 * Write to ad_status_history table.
 */
export const logStatusChange = async ({
  ad_id,
  previous_status,
  new_status,
  changed_by = null,
  note       = null,
}) => {
  try {
    await supabase.from('ad_status_history').insert({
      ad_id, previous_status, new_status, changed_by, note,
    });
  } catch (err) {
    console.error('[STATUS_HISTORY] Failed:', err.message);
  }
};
