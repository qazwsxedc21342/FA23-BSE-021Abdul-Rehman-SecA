import supabase from '../db/supabase.js';

/**
 * Calculate rank score for an ad.
 *
 * rankScore = (featured ? 50 : 0)
 *           + (packageWeight * 10)
 *           + freshnessPoints    (max 20, decays over 7 days)
 *           + adminBoost
 *           + verifiedSellerPoints (5 if seller is verified)
 */
export const calculateRankScore = ({ is_featured, package_weight = 1, publish_at, admin_boost = 0, seller_verified = false }) => {
  const featuredPoints      = is_featured ? 50 : 0;
  const packagePoints       = (package_weight || 1) * 10;
  const verifiedPoints      = seller_verified ? 5 : 0;

  // Freshness: published within last 7 days gets bonus decaying linearly
  let freshnessPoints = 0;
  if (publish_at) {
    const ageMs   = Date.now() - new Date(publish_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 7) freshnessPoints = Math.round(20 * (1 - ageDays / 7));
  }

  return featuredPoints + packagePoints + freshnessPoints + (admin_boost || 0) + verifiedPoints;
};

/**
 * Recalculate and persist rank score for a single ad.
 */
export const updateRankScore = async (adId) => {
  const { data: ad } = await supabase
    .from('ads')
    .select('id, is_featured, admin_boost, publish_at, package_id, user_id')
    .eq('id', adId)
    .single();

  if (!ad) return;

  // Get package weight
  let package_weight = 1;
  if (ad.package_id) {
    const { data: pkg } = await supabase.from('packages').select('weight').eq('id', ad.package_id).single();
    if (pkg) package_weight = pkg.weight;
  }

  // Get seller verification
  const { data: profile } = await supabase
    .from('seller_profiles')
    .select('is_verified')
    .eq('user_id', ad.user_id)
    .single();

  const rank_score = calculateRankScore({
    is_featured:     ad.is_featured,
    package_weight,
    publish_at:      ad.publish_at,
    admin_boost:     ad.admin_boost,
    seller_verified: profile?.is_verified || false,
  });

  await supabase.from('ads').update({ rank_score }).eq('id', adId);
  return rank_score;
};
