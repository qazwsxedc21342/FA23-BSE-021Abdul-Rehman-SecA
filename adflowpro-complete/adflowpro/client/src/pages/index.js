import { useState, useEffect } from 'react';
import Link from 'next/link';
import { publicAPI } from '../utils/api';
import { AdCard, Spinner } from '../components/UI';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [featuredAds, setFeaturedAds]   = useState([]);
  const [recentAds,   setRecentAds]     = useState([]);
  const [packages,    setPackages]       = useState([]);
  const [question,    setQuestion]       = useState(null);
  const [showAnswer,  setShowAnswer]     = useState(false);
  const [loading,     setLoading]        = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [adsRes, pkgRes, qRes] = await Promise.all([
          publicAPI.getAds({ limit: 8, sort: 'rank' }),
          publicAPI.getPackages(),
          publicAPI.getQuestion(),
        ]);
        const ads = adsRes.data.data || [];
        setFeaturedAds(ads.filter(a => a.is_featured).slice(0, 4));
        setRecentAds(ads.filter(a => !a.is_featured).slice(0, 4));
        setPackages(pkgRes.data.data || []);
        setQuestion(qRes.data.data);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load homepage data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const PKG_COLORS = { Basic: '#6b7280', Standard: '#3b82f6', Premium: '#f5a623' };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #1a0a2e 100%)',
        borderBottom: '1px solid #334155',
        padding: '72px 24px 64px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#f5a623', fontWeight: 700, letterSpacing: 3, marginBottom: 16 }}>
            PAKISTAN'S MODERATED LISTING MARKETPLACE
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#f1f5f9', margin: '0 0 20px', lineHeight: 1.1, letterSpacing: -1 }}>
            Buy. Sell.<br /><span style={{ color: '#e94560' }}>AdFlow</span> <span style={{ color: '#f5a623' }}>Pro.</span>
          </h1>
          <p style={{ fontSize: 17, color: '#94a3b8', marginBottom: 36, lineHeight: 1.7 }}>
            Every listing is verified by our moderation team.<br />
            No spam, no fakes — only real, approved ads.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/explore" className="btn-primary" style={{ padding: '12px 32px', fontSize: 15, borderRadius: 10, display: 'inline-block' }}>
              Browse Listings
            </Link>
            <Link href="/packages" className="btn-secondary" style={{ padding: '12px 32px', fontSize: 15, borderRadius: 10, display: 'inline-block', border: '1px solid #334155' }}>
              View Packages
            </Link>
          </div>
        </div>
      </div>

      {/* ── Trust Badges ─────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #334155', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            ['✓', 'Verified Sellers',    '#22c55e'],
            ['🛡', 'Moderated Content',  '#3b82f6'],
            ['⚡', 'Fast Approval',      '#f59e0b'],
            ['📦', 'Package Ranking',    '#8b5cf6'],
            ['🔒', 'Secure Payments',    '#06b6d4'],
          ].map(([icon, label, c]) => (
            <div key={label} style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
              padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
            }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span style={{ color: '#94a3b8' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">

        {/* ── Featured Ads ─────────────────────────────────────── */}
        {loading ? <Spinner /> : (
          <>
            {featuredAds.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>
                    <span style={{ color: '#f5a623' }}>★</span> Featured Listings
                  </h2>
                  <Link href="/explore" style={{ fontSize: 13, color: '#e94560', fontWeight: 600 }}>View all →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {featuredAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                </div>
              </div>
            )}

            {/* ── Recent Ads ─────────────────────────────────────── */}
            {recentAds.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Recent Listings</h2>
                  <Link href="/explore" style={{ fontSize: 13, color: '#e94560', fontWeight: 600 }}>View all →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {recentAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Packages Preview ─────────────────────────────────── */}
        {packages.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 20 }}>Listing Packages</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {packages.map((pkg, i) => {
                const color = PKG_COLORS[pkg.name] || '#6b7280';
                return (
                  <div key={pkg.id} style={{
                    background: '#1e293b',
                    border: `2px solid ${i === 2 ? color + '55' : '#334155'}`,
                    borderRadius: 14, padding: 24, position: 'relative',
                  }}>
                    {i === 2 && (
                      <div style={{ position: 'absolute', top: -1, right: 16, background: color, color: '#1a1a2e', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: '0 0 8px 8px' }}>
                        POPULAR
                      </div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 1.5, marginBottom: 6 }}>{pkg.name.toUpperCase()}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', marginBottom: 2 }}>
                      PKR {Number(pkg.price).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{pkg.duration_days} days · {pkg.weight}x weight</div>
                    <Link href="/packages" style={{ display: 'inline-block', background: color, color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      Learn More
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Learning Question Widget ─────────────────────────── */}
        {question && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 28, maxWidth: 540 }}>
            <div style={{ fontSize: 11, color: '#f5a623', fontWeight: 700, letterSpacing: 1.5, marginBottom: 12 }}>
              💡 LEARNING QUESTION · {question.topic}
            </div>
            <p style={{ fontSize: 16, color: '#f1f5f9', marginBottom: 18, lineHeight: 1.6 }}>{question.question}</p>
            {showAnswer ? (
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 14, fontSize: 14, color: '#86efac', lineHeight: 1.6 }}>
                {question.answer}
              </div>
            ) : (
              <button className="btn-primary" style={{ padding: '8px 20px' }} onClick={() => setShowAnswer(true)}>
                Reveal Answer
              </button>
            )}
            {showAnswer && (
              <button style={{ marginTop: 12, background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}
                onClick={() => {
                  setShowAnswer(false);
                  publicAPI
                    .getQuestion()
                    .then((r) => { setQuestion(r.data.data); })
                    .catch((e) => {
                      console.error(e);
                      toast.error('Failed to load next question');
                    });
                }}>
                → Next question
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
