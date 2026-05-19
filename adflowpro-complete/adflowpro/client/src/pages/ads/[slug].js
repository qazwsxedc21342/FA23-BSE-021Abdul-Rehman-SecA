import { Spinner, PackageBadge, StatusBadge } from '../../components/UI';
import toast                from 'react-hot-toast';
import { motion }           from 'framer-motion';

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
    <div style={{ background: '#0f172a', minHeight: '100vh', paddingBottom: 60, perspective: 1200 }}>
      <div className="section" style={{ maxWidth: 1100 }}>

        {/* Breadcrumb */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ fontSize: 13, color: '#64748b', marginBottom: 24, display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link> /
          <Link href="/explore" style={{ color: '#64748b', textDecoration: 'none' }}>Explore</Link> /
          <span style={{ color: '#94a3b8' }}>{ad.title}</span>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

          {/* ── Left: Media + Details ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 5 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Media */}
            <motion.div 
              className="glass"
              whileHover={{ scale: 1.01 }}
              style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 28, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
            >
              {videoId ? (
                <iframe
                  width="100%" height="400"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0" allowFullScreen
                  style={{ display: 'block' }}
                />
              ) : thumb && !imgErr ? (
                <img src={thumb} alt={ad.title} onError={() => setImgErr(true)}
                  style={{ width: '100%', height: 400, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 64 }}>📷</div>
              )}
            </motion.div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              {ad.packages && <PackageBadge name={ad.packages.name} />}
              {ad.is_featured && (
                <span style={{ background: 'linear-gradient(45deg, #f5a62322, #f5a62344)', color: '#f5a623', border: '1px solid #f5a62344', padding: '4px 14px', borderRadius: 24, fontSize: 12, fontWeight: 700 }}>★ TOP LISTING</span>
              )}
              {ad.seller_profiles?.is_verified && (
                <span style={{ background: 'linear-gradient(45deg, #22c55e22, #22c55e44)', color: '#22c55e', border: '1px solid #22c55e44', padding: '4px 14px', borderRadius: 24, fontSize: 12, fontWeight: 700 }}>✓ VERIFIED SELLER</span>
              )}
            </div>

            <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', marginBottom: 12, lineHeight: 1.1, letterSpacing: -1 }}>{ad.title}</h1>
            
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', fontWeight: 500 }}>
              <span>📂 <span style={{ color: '#f1f5f9' }}>{ad.categories?.name}</span></span>
              <span>📍 <span style={{ color: '#f1f5f9' }}>{ad.cities?.name}</span></span>
              {ad.expire_at && <span>⏰ <span style={{ color: '#f1f5f9' }}>Expires: {new Date(ad.expire_at).toLocaleDateString()}</span></span>}
              <span>📊 <span style={{ color: '#f1f5f9' }}>Rank: {ad.rank_score}</span></span>
            </div>

            {/* Description */}
            <motion.div 
              className="glass"
              style={{ borderRadius: 20, padding: 28, marginBottom: 24, border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Description</div>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{ad.description}</p>
            </motion.div>

            {/* Media sources */}
            {media.length > 0 && (
              <motion.div 
                className="glass"
                style={{ borderRadius: 20, padding: 24, border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase' }}>Assets Validation</div>
                {media.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
                    <span style={{ color: m.validation_status === 'valid' ? '#22c55e' : '#ef4444', fontSize: 16 }}>
                      {m.validation_status === 'valid' ? '●' : '●'}
                    </span>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{m.source_type}</span>
                    <span style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace' }}>{m.original_url?.slice(0, 40)}...</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* ── Right: Seller + Actions ───────────────────────── */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >

            {/* Price card */}
            <motion.div 
              className="glass"
              whileHover={{ scale: 1.02, rotateY: -3 }}
              style={{ borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Target Price</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: '#e94560', marginBottom: 24 }}>{ad.price || 'Contact Seller'}</div>
              
              <motion.button 
                whileHover={{ scale: 1.03, backgroundColor: '#ff5a77' }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary" style={{ width: '100%', padding: '16px 0', fontSize: 15, borderRadius: 14, marginBottom: 14, fontWeight: 800 }}
                onClick={() => toast.success('Contact request sent!')}>
                📞 CONTACT SELLER
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary" style={{ width: '100%', padding: '14px 0', fontSize: 15, borderRadius: 14, border: '1px solid #334155' }}
                onClick={() => toast('Ad reported. We will review it.', { icon: '⚠️' })}>
                Report Listing
              </motion.button>
            </motion.div>

            {/* Seller info */}
            <motion.div 
              className="glass"
              style={{ borderRadius: 24, padding: 28, border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 1 }}>Seller Intelligence</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 20, background: 'linear-gradient(135deg, #1e293b, #334155)', border: '1px solid #e9456044', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#e94560', boxShadow: '0 10px 20px rgba(233, 69, 96, 0.2)' }}>
                  {(ad.seller_profiles?.display_name || ad.users?.name || 'S')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 18 }}>
                    {ad.seller_profiles?.display_name || ad.users?.name}
                  </div>
                  {ad.seller_profiles?.business_name && (
                    <div style={{ fontSize: 13, color: '#e94560', fontWeight: 600 }}>{ad.seller_profiles.business_name}</div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  ['📍', 'Location', ad.seller_profiles?.city || ad.cities?.name],
                  ['📦', 'Ad Package',  ad.packages?.name],
                  ['📅', 'Date Posted',   ad.publish_at ? new Date(ad.publish_at).toLocaleDateString() : 'N/A'],
                  ['⏰', 'Expiry',  ad.expire_at ? new Date(ad.expire_at).toLocaleDateString() : 'N/A'],
                ].map(([icon, label, value]) => value && (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>{icon} {label}</span>
                    <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Safety tip */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{ background: 'linear-gradient(135deg, #f5a62311, #f5a62305)', border: '1px solid #f5a62322', borderRadius: 16, padding: 18 }}
            >
              <div style={{ fontSize: 13, color: '#f5a623', fontWeight: 700, marginBottom: 8 }}>⚠️ TRANSACTION SAFETY</div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Meet in a safe public place. Never send advance payments. Verify identity before sharing sensitive data.
              </p>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
