import { useState, useEffect } from 'react';
import Link from 'next/link';
import { publicAPI } from '../utils/api';
import { AdCard, Spinner } from '../components/UI';
import toast from 'react-hot-toast';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

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

      {/* ── 3D Hero ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 24px 120px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Floating Icons */}
        <motion.img 
          src="file:///C:/Users/user/.gemini/antigravity/brain/2f14462d-8545-4152-b160-4434e9ebd3ad/marketplace_icon_3d_1775574532347.png"
          style={{ position: 'absolute', top: '15%', left: '10%', width: 120, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img 
          src="file:///C:/Users/user/.gemini/antigravity/brain/2f14462d-8545-4152-b160-4434e9ebd3ad/security_icon_3d_1775574583514.png"
          style={{ position: 'absolute', bottom: '20%', right: '12%', width: 100, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img 
          src="file:///C:/Users/user/.gemini/antigravity/brain/2f14462d-8545-4152-b160-4434e9ebd3ad/delivery_icon_3d_1775574602383.png"
          style={{ position: 'absolute', top: '20%', right: '15%', width: 80, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}
          animate={{ scale: [1, 1.1, 1], x: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1, ease: "circOut" }}
          style={{ maxWidth: 850, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}
        >
          <motion.div 
            style={{ fontSize: 13, color: '#f5a623', fontWeight: 800, letterSpacing: 4, marginBottom: 24, textTransform: 'uppercase' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            The Next Generation of Controlled Commerce
          </motion.div>
          <h1 style={{ fontSize: 'clamp(40px, 8vw, 76px)', fontWeight: 900, color: '#f1f5f9', margin: '0 0 28px', lineHeight: 1, letterSpacing: -3 }}>
            Marketplace <span style={{ color: '#e94560', textShadow: '0 0 30px rgba(233,69,96,0.4)' }}>Redefined.</span>
          </h1>
          <p style={{ fontSize: 20, color: '#94a3b8', marginBottom: 44, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 44px' }}>
            Powered by human moderation and premium 3D ranking. 
            No fakes. No noise. Just pure, verified value.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/explore" className="btn-primary" style={{ padding: '16px 40px', fontSize: 16, borderRadius: 12, boxShadow: '0 10px 40px -10px rgba(233,69,96,0.5)' }}>
              Explore Listings
            </Link>
            <Link href="/packages" className="btn-secondary glass" style={{ padding: '16px 40px', fontSize: 16, borderRadius: 12 }}>
              View Packages
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── 3D Trust Badges ───────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', background: 'rgba(15,23,42,0.8)' }}>
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {[
            ['🛡', '100% Moderated',   '#3b82f6'],
            ['✅', 'Verified Sellers',  '#22c55e'],
            ['⚡', 'Turbo Approval',    '#f59e0b'],
            ['★', 'Premium Ranking',   '#e94560'],
          ].map(([icon, label, c]) => (
            <motion.div key={label} 
              whileHover={{ scale: 1.05, y: -5, rotateY: 15 }}
              className="glass"
              style={{
                borderRadius: 14, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
                border: `1px solid ${c}22`
              }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{label}</span>
            </motion.div>
          ))}
        </motion.div>
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
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 64 }}
          >
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', marginBottom: 32, textAlign: 'center' }}>Elevate Your Reach</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {packages.map((pkg, i) => {
                const color = PKG_COLORS[pkg.name] || '#6b7280';
                return (
                  <motion.div 
                    key={pkg.id} 
                    whileHover={{ y: -10, scale: 1.03, rotateX: 5 }}
                    className="glass"
                    style={{
                      padding: 32, borderRadius: 20, position: 'relative',
                      border: `1px solid ${i === 2 ? color + '88' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: i === 2 ? `0 20px 40px -10px ${color}33` : 'none'
                    }}>
                    {i === 2 && (
                      <div style={{ position: 'absolute', top: 12, right: 12, background: color, color: '#1a1a2e', fontSize: 10, fontWeight: 900, padding: '4px 12px', borderRadius: 20 }}>
                        BEST VALUE
                      </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>{pkg.name} Plan</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 500, marginRight: 4 }}>PKR</span>
                      {Number(pkg.price).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      Valid for {pkg.duration_days} days · {pkg.weight}x visibility boost
                    </div>
                    <Link href={`/packages?pkg=${pkg.id}`} style={{ 
                      display: 'block', textAlign: 'center', background: i === 2 ? color : 'rgba(255,255,255,0.05)', 
                      color: i === 2 ? '#1a1a2e' : '#fff', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, 
                      textDecoration: 'none', transition: 'all 0.2s'
                    }}>
                      Select Plan
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Learning Question Hub ─────────────────────────── */}
        {question && (
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass" 
            style={{ borderRadius: 20, padding: 40, maxWidth: 640, margin: '0 auto', border: '1px solid rgba(233,69,96,0.2)' }}
          >
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ background: '#e94560', color: '#fff', width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                💡
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#f5a623', fontWeight: 800, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
                  Knowledge Hub · {question.topic}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 20, lineHeight: 1.4 }}>{question.question}</h3>
                
                {showAnswer ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ background: '#0f172a88', borderRadius: 12, padding: 20, fontSize: 15, color: '#94a3b8', lineHeight: 1.6, borderLeft: '4px solid #e94560' }}>
                    {question.answer}
                  </motion.div>
                ) : (
                  <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={() => setShowAnswer(true)}>
                    Reveal Explanation
                  </button>
                )}
                
                {showAnswer && (
                  <motion.button 
                    whileHover={{ x: 5 }}
                    style={{ marginTop: 24, background: 'none', border: 'none', color: '#e94560', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => {
                      setShowAnswer(false);
                      publicAPI.getQuestion().then(r => setQuestion(r.data.data));
                    }}>
                    Master Another Topic <span style={{ fontSize: 16 }}>→</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
