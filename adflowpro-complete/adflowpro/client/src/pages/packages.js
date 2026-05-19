import { useState, useEffect } from 'react';
import Link from 'next/link';
import { publicAPI } from '../utils/api';
import { useAuth } from '../features/auth/AuthContext';
import { Spinner } from '../components/UI';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const PKG_COLORS   = { Basic: '#6b7280', Standard: '#3b82f6', Premium: '#f5a623' };
const PKG_FEATURES = {
  Basic:    ['7-day listing', '1x ranking weight', 'Standard placement', 'Basic support'],
  Standard: ['15-day listing', '2x ranking weight', 'Category priority', 'Manual refresh', 'Standard support'],
  Premium:  ['30-day listing', '3x ranking weight', 'Homepage featured', 'Auto-refresh every 3 days', 'Priority support', 'Verified badge'],
};

export default function PackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    publicAPI.getPackages()
      .then(r => setPackages(r.data.data || []))
      .catch((e) => {
        console.error(e);
        toast.error('Failed to load packages');
        setPackages([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <div className="section">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', marginBottom: 12 }}>Listing Packages</h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Choose the right plan to maximise your ad's reach. All listings are moderated before going live.
          </p>
        </div>

        {loading ? <Spinner /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, maxWidth: 1100, margin: '0 auto 64px' }}>
            {packages.map((pkg, i) => {
              const color    = PKG_COLORS[pkg.name] || '#6b7280';
              const features = PKG_FEATURES[pkg.name] || [];
              return (
                <motion.div 
                  key={pkg.id} 
                  className="glass"
                  initial={{ opacity: 0, y: 30, rotateY: -10 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  whileHover={{ y: -10, scale: 1.02, rotateY: 5, boxShadow: `0 20px 40px ${color}15` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  style={{
                    border: `1px solid ${i === 2 ? color + '44' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 24, padding: 40, position: 'relative',
                  }}
                >
                  {i === 2 && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: color, color: '#000', fontSize: 11, fontWeight: 900, padding: '6px 20px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: `0 10px 20px ${color}33` }}>
                      ★ MOST POPULAR
                    </div>
                  )}

                  <div style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: 3, marginBottom: 16 }}>{pkg.name.toUpperCase()}</div>
                  <div style={{ fontSize: 44, fontWeight: 900, color: '#f1f5f9', marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 18, color: '#64748b', fontWeight: 500 }}>PKR</span>
                    {Number(pkg.price).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>{pkg.description || `${pkg.duration_days}-day listing`}</div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 28, marginBottom: 32 }}>
                    {features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, fontSize: 14 }}>
                        <span style={{ color, fontSize: 18 }}>✓</span>
                        <span style={{ color: '#94a3b8' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Ranking weight visual */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 32 }}>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>Rank Visibility</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1,2,3].map(n => (
                        <div key={n} style={{ flex: 1, height: 8, borderRadius: 4, background: n <= pkg.weight ? color : '#334155', boxShadow: n <= pkg.weight ? `0 0 10px ${color}44` : 'none' }} />
                      ))}
                    </div>
                  </div>

                  <Link
                    href={user ? `/client/dashboard?tab=payment&pkg=${pkg.id}` : `/register?pkg=${pkg.id}`}
                    style={{
                      display: 'block', textAlign: 'center',
                      background: color, color: '#000',
                      borderRadius: 12, padding: '16px 0', fontSize: 15, fontWeight: 800,
                      textDecoration: 'none', transition: 'all 0.3s ease',
                      boxShadow: `0 10px 20px ${color}22`
                    }}
                  >
                    {user ? 'Choose Plan →' : 'Sign Up Now →'}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Comparison table */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden', maxWidth: 800, margin: '0 auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Feature</th>
                {['Basic', 'Standard', 'Premium'].map(p => (
                  <th key={p} style={{ padding: '14px 20px', textAlign: 'center', color: PKG_COLORS[p], fontWeight: 700 }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Duration',         '7 days',   '15 days',  '30 days'],
                ['Ranking Weight',   '1×',       '2×',       '3×'],
                ['Homepage Featured','✗',        '✗',        '✓'],
                ['Category Priority','✗',        '✓',        '✓'],
                ['Auto Refresh',     '✗',        '✗',        '✓'],
                ['Price (PKR)',      '999',      '2,499',    '4,999'],
              ].map(([label, ...vals], i) => (
                <tr key={label} style={{ background: i % 2 === 0 ? 'transparent' : '#ffffff06' }}>
                  <td style={{ padding: '12px 20px', color: '#94a3b8', borderTop: '1px solid #334155' }}>{label}</td>
                  {vals.map((v, j) => (
                    <td key={j} style={{ padding: '12px 20px', textAlign: 'center', borderTop: '1px solid #334155', color: v === '✓' ? '#22c55e' : v === '✗' ? '#475569' : '#f1f5f9', fontWeight: v === '✓' || v === '✗' ? 700 : 500 }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
