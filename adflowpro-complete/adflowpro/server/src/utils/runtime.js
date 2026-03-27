export const getSupabaseConfigIssues = () => {
  const issues = [];

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) issues.push('SUPABASE_URL missing');
  else if (String(supabaseUrl).includes('your-project-id.supabase.co')) {
    issues.push('SUPABASE_URL placeholder');
  }

  if (!supabaseServiceKey) issues.push('SUPABASE_SERVICE_KEY missing');
  else if (String(supabaseServiceKey).includes('your-service-role-key-here')) {
    issues.push('SUPABASE_SERVICE_KEY placeholder');
  }

  return issues;
};

export const supabaseLooksUnconfigured = () => getSupabaseConfigIssues().length > 0;

export const getDemoModeInfo = () => {
  const forced = String(process.env.DEMO_MODE).toLowerCase() === 'true';
  const supabaseIssues = getSupabaseConfigIssues();
  const enabled = forced || supabaseIssues.length > 0;

  return {
    enabled,
    forced,
    supabaseIssues,
  };
};

export const isDemoMode = () => getDemoModeInfo().enabled;
