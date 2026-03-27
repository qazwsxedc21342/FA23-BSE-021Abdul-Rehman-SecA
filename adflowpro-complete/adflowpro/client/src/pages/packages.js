import { useState, useEffect } from 'react';
import Link from 'next/link';
import { publicAPI } from '../utils/api';
import { useAuth } from '../features/auth/AuthContext';
import { Spinner } from '../components/UI';
import toast from 'react-hot-toast';

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 960, margin: '0 auto 48px' }}>
            {packages.map((pkg, i) => {
              const color    = PKG_COLORS[pkg.name] || '#6b7280';
              const features = PKG_FEATURES[pkg.name] || [];
              return (
                <div key={pkg.id} style={{
                  background: '#1e293b',
                  border: `2px solid ${i === 2 ? color + '66' : '#334155'}`,
                  borderRadius: 18, padding: 32, position: 'relative',
                  transform: i === 2 ? 'scale(1.02)' : 'none',
                  boxShadow: i === 2 ? `0 0 40px ${color}22` : 'none',
                }}>
                  {i === 2 && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: color, color: '#1a1a2e', fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      ★ MOST POPULAR
                    </div>
                  )}

                  <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: 2, marginBottom: 10 }}>{pkg.name.toUpperCase()}</div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>
                    PKR {Number(pkg.price).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{pkg.description || `${pkg.duration_days}-day listing`}</div>

                  <div style={{ borderTop: '1px solid #334155', paddingTop: 20, marginBottom: 24 }}>
                    {features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, fontSize: 14 }}>
                        <span style={{ color, fontSize: 16, lineHeight: 1.2 }}>✓</span>
                        <span style={{ color: '#94a3b8' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Ranking weight visual */}
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', marginBottom: 24 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>RANK WEIGHT</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3].map(n => (
                        <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= pkg.weight ? color : '#334155' }} />
                      ))}
                    </div>
                  </div>

                  <Link
                    href={user ? '/client/dashboard' : '/register'}
                    style={{
                      display: 'block', textAlign: 'center',
                      background: color, color: i === 2 ? '#1a1a2e' : '#fff',
                      borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 700,
                      textDecoration: 'none', transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.opacity = '0.85'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                  >
                    {user ? 'Post an Ad →' : 'Get Started →'}
                  </Link>
                </div>
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
