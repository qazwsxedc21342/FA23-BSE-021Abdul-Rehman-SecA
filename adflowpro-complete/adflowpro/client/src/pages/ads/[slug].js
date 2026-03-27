import { useRouter }        from 'next/router';
import { useState, useEffect } from 'react';
import Link                 from 'next/link';
import { publicAPI }        from '../../utils/api';
import { Spinner, PackageBadge, StatusBadge } from '../../components/UI';
import toast                from 'react-hot-toast';

export default function AdDetailPage() {
  const router      = useRouter();
  const { slug }    = router.query;
  const [ad,      setAd]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgErr,  setImgErr]  = useState(false);

  useEffect(() => {
    if (!slug) return;
    publicAPI.getAdBySlug(slug)
      .then(r => setAd(r.data.data))
      .catch(() => router.push('/404'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ background: '#0f172a', minHeight: '100vh' }}><Spinner /></div>;
  if (!ad)     return null;

  const media      = ad.ad_media || [];
  const thumb      = media.find(m => m.validation_status === 'valid')?.thumbnail_url;
  const isYoutube  = media.find(m => m.source_type === 'youtube');
  const videoId    = isYoutube?.original_url?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <div className="section" style={{ maxWidth: 1100 }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/" style={{ color: '#64748b' }}>Home</Link> /
          <Link href="/explore" style={{ color: '#64748b' }}>Explore</Link> /
          <span style={{ color: '#94a3b8' }}>{ad.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

          {/* ── Left: Media + Details ─────────────────────────── */}
          <div>
            {/* Media */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
              {videoId ? (
                <iframe
                  width="100%" height="360"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0" allowFullScreen
                  style={{ display: 'block' }}
                />
              ) : thumb && !imgErr ? (
                <img src={thumb} alt={ad.title} onError={() => setImgErr(true)}
                  style={{ width: '100%', height: 360, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 48 }}>📷</div>
              )}
            </div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {ad.packages && <PackageBadge name={ad.packages.name} />}
              {ad.is_featured && (
                <span style={{ background: '#f5a62322', color: '#f5a623', border: '1px solid #f5a62344', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>★ Featured</span>
              )}
              {ad.seller_profiles?.is_verified && (
                <span style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>✓ Verified Seller</span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.2 }}>{ad.title}</h1>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>📂 {ad.categories?.name}</span>
              <span>📍 {ad.cities?.name}</span>
              {ad.expire_at && <span>⏰ Expires: {new Date(ad.expire_at).toLocaleDateString()}</span>}
              <span>📊 Rank: {ad.rank_score}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#e94560', margin: '16px 0 20px' }}>
              {ad.price || 'Contact for price'}
            </div>

            {/* Description */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 10 }}>Description</div>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{ad.description}</p>
            </div>

            {/* Media sources */}
            {media.length > 0 && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Media Sources</div>
                {media.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    <span style={{ color: m.validation_status === 'valid' ? '#22c55e' : '#ef4444' }}>
                      {m.validation_status === 'valid' ? '✓' : '✗'}
                    </span>
                    <span style={{ textTransform: 'capitalize' }}>{m.source_type}</span>
                    <span style={{ color: '#475569', fontSize: 11 }}>{m.original_url?.slice(0, 50)}...</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Seller + Actions ───────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Price card */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#e94560', marginBottom: 16 }}>{ad.price || 'Contact Seller'}</div>
              <button className="btn-primary" style={{ width: '100%', padding: '11px 0', fontSize: 14, borderRadius: 10, marginBottom: 10 }}
                onClick={() => toast.success('Contact request sent!')}>
                📞 Contact Seller
              </button>
              <button className="btn-secondary" style={{ width: '100%', padding: '11px 0', fontSize: 14, borderRadius: 10 }}
                onClick={() => toast('Ad reported. We will review it.', { icon: '⚠️' })}>
                Report Ad
              </button>
            </div>

            {/* Seller info */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>SELLER INFO</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#e94560' }}>
                  {(ad.seller_profiles?.display_name || ad.users?.name || 'S')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>
                    {ad.seller_profiles?.display_name || ad.users?.name}
                  </div>
                  {ad.seller_profiles?.business_name && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>{ad.seller_profiles.business_name}</div>
                  )}
                </div>
              </div>
              {[
                ['📍', 'Location', ad.seller_profiles?.city || ad.cities?.name],
                ['📦', 'Package',  ad.packages?.name],
                ['📅', 'Posted',   ad.publish_at ? new Date(ad.publish_at).toLocaleDateString() : 'N/A'],
                ['⏰', 'Expires',  ad.expire_at ? new Date(ad.expire_at).toLocaleDateString() : 'N/A'],
              ].map(([icon, label, value]) => value && (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderTop: '1px solid #334155' }}>
                  <span style={{ color: '#64748b' }}>{icon} {label}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Safety tip */}
            <div style={{ background: '#f5a62311', border: '1px solid #f5a62333', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, color: '#f5a623', fontWeight: 600, marginBottom: 6 }}>⚠️ Safety Tip</div>
              <p style={{ fontSize: 12, color: '#92652a', lineHeight: 1.6 }}>
                Meet in a safe public place. Never send advance payments without verifying the seller. AdFlow Pro does not guarantee any transactions.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
