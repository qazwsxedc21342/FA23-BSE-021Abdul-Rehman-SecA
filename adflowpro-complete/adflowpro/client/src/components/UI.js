import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// ─── Status Colors ────────────────────────────────────────────
const STATUS_COLORS = {
  draft:             '#6b7280',
  submitted:         '#3b82f6',
  under_review:      '#f59e0b',
  payment_pending:   '#8b5cf6',
  payment_submitted: '#6366f1',
  payment_verified:  '#06b6d4',
  scheduled:         '#10b981',
  published:         '#22c55e',
  expired:           '#ef4444',
  rejected:          '#dc2626',
};

const STATUS_LABELS = {
  draft:             'Draft',
  submitted:         'Submitted',
  under_review:      'Under Review',
  payment_pending:   'Payment Pending',
  payment_submitted: 'Payment Submitted',
  payment_verified:  'Payment Verified',
  scheduled:         'Scheduled',
  published:         'Published',
  expired:           'Expired',
  rejected:          'Rejected',
};

const PKG_COLORS = { Basic: '#6b7280', Standard: '#3b82f6', Premium: '#f59e0b' };

// ─── StatusBadge ─────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const color = STATUS_COLORS[status] || '#6b7280';
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      letterSpacing: 0.3, display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
};

// ─── PackageBadge ────────────────────────────────────────────
export const PackageBadge = ({ name }) => {
  const color = PKG_COLORS[name] || '#6b7280';
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    }}>{name}</span>
  );
};

// ─── AdCard ──────────────────────────────────────────────────
export const AdCard = ({ ad }) => {
  const thumb = ad.ad_media?.[0]?.thumbnail_url;
  const pkg   = ad.packages?.name;
  const cat   = ad.categories?.name;
  const city  = ad.cities?.name;
  const verified = ad.seller_profiles?.is_verified;

  return (
    <motion.div
      whileHover={{ 
        y: -5, 
        rotateX: 6, 
        rotateY: -4, 
        scale: 1.02,
        transition: { duration: 0.3, ease: 'easeOut' } 
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{ perspective: 1000, height: '100%' }}
    >
      <Link href={`/ads/${ad.slug}`} style={{ textDecoration: 'none' }}>
        <div className="glass" style={{
          borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
          height: '100%', border: `1px solid ${ad.is_featured ? '#f5a62344' : 'rgba(255,255,255,0.05)'}`,
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.3s'
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(233,69,96,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.3)'; }}
        >
        {/* Image */}
        <div style={{ position: 'relative', height: 160, background: '#0f172a', overflow: 'hidden' }}>
          {thumb ? (
            <img src={thumb} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 32 }}>📷</div>
          )}
          {ad.is_featured && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: '#f5a623', color: '#1a1a2e', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, letterSpacing: 0.5 }}>★ FEATURED</span>
          )}
          {pkg && <span style={{ position: 'absolute', top: 8, right: 8 }}><PackageBadge name={pkg} /></span>}
        </div>

        {/* Body */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4, lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {ad.title}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{cat} · {city}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e94560' }}>{ad.price || 'Contact for price'}</div>
            {verified && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>✓ VERIFIED</span>}
          </div>
        </div>
      </div>
    </Link>
    </motion.div>
  );
};

export const StatCard = ({ label, value, color = '#3b82f6', sub }) => (
  <motion.div 
    whileHover={{ scale: 1.05, rotateY: 10 }}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass"
    style={{ borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 120, border: '1px solid rgba(255,255,255,0.05)' }}
  >
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sub}</div>}
  </motion.div>
);

// ─── Spinner ──────────────────────────────────────────────────
export const Spinner = ({ size = 32 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
    <div style={{
      width: size, height: size,
      border: '3px solid #334155',
      borderTopColor: '#e94560',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', message = 'Nothing here yet' }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15 }}>{message}</div>
  </div>
);

// ─── Page Header ─────────────────────────────────────────────
export const PageHeader = ({ title, sub, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>{title}</h1>
      {sub && <p style={{ fontSize: 13, color: '#64748b' }}>{sub}</p>}
    </div>
    {action}
  </div>
);

// ─── ProtectedRoute ───────────────────────────────────────────
export const withRole = (Component, ...allowedRoles) => {
  return function ProtectedPage(props) {
    if (typeof window === 'undefined') return null;
    const Cookies = require('js-cookie').default;
    const stored = Cookies.get('user');
    if (!stored) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      return null;
    }
    try {
      const user = JSON.parse(stored);
      if (!allowedRoles.includes(user.role)) {
        if (typeof window !== 'undefined') window.location.href = '/';
        return null;
      }
    } catch { window.location.href = '/login'; return null; }
    return <Component {...props} />;
  };
};
