import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { clientAPI, publicAPI } from '../../utils/api';
import { StatusBadge, PackageBadge, StatCard, Spinner, EmptyState, PageHeader } from '../../components/UI';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab,         setTab]         = useState('ads');
  const [dashboard,   setDashboard]   = useState(null);
  const [categories,  setCategories]  = useState([]);
  const [cities,      setCities]      = useState([]);
  const [packages,    setPackages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  const [adForm, setAdForm] = useState({ title: '', description: '', price: '', category_id: '', city_id: '', media_urls: [''] });
  const [payForm, setPayForm] = useState({ ad_id: '', package_id: '', method: 'EasyPaisa', transaction_ref: '', sender_name: '', screenshot_url: '' });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user && user.role !== 'client') { router.push('/'); return; }
    if (user) {
      loadData().then(() => {
        // Handle deep-linking from query params
        const { tab: qTab, pkg: qPkg } = router.query;
        if (qTab) setTab(qTab);
        if (qPkg) setPayForm(prev => ({ ...prev, package_id: qPkg }));
      });
    }
  }, [user, authLoading, router.isReady, router.query]);

  const loadData = async () => {
    try {
      const [dashRes, catRes, cityRes, pkgRes] = await Promise.all([
        clientAPI.getDashboard(),
        publicAPI.getCategories(),
        publicAPI.getCities(),
        publicAPI.getPackages(),
      ]);
      setDashboard(dashRes.data.data);
      setCategories(catRes.data.data || []);
      setCities(cityRes.data.data || []);
      setPackages(pkgRes.data.data || []);
    } catch (e) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!adForm.title || !adForm.category_id || !adForm.city_id || !adForm.description) {
      toast.error('Please fill all required fields'); return;
    }
    setSubmitting(true);
    try {
      const payload = { ...adForm, media_urls: adForm.media_urls.filter(Boolean) };
      const res = await clientAPI.createAd(payload);
      const adId = res.data.data.id;
      await clientAPI.submitAd(adId);
      toast.success('Ad submitted for review!');
      setAdForm({ title: '', description: '', price: '', category_id: '', city_id: '', media_urls: [''] });
      setTab('ads');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payForm.ad_id || !payForm.package_id || !payForm.transaction_ref) {
      toast.error('Please fill all required fields'); return;
    }
    setSubmitting(true);
    try {
      await clientAPI.submitPayment(payForm);
      toast.success('Payment proof submitted!');
      setPayForm({ ad_id: '', package_id: '', method: 'EasyPaisa', transaction_ref: '', sender_name: '', screenshot_url: '' });
      setTab('ads');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) return <div style={{ background: '#0f172a', minHeight: '100vh' }}><Spinner /></div>;
  if (!dashboard) return null;

  const { ads, summary, notifications } = dashboard;
  const pendingPaymentAds = ads.filter(a => a.status === 'payment_pending');
  const PKG_COLORS = { Basic: '#6b7280', Standard: '#3b82f6', Premium: '#f5a623' };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <div className="section">
        <PageHeader title={`Welcome, ${user.name}`} sub="Manage your listings and payments" />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatCard label="Total Ads"     value={summary.total}    color="#3b82f6" />
          <StatCard label="Active"        value={summary.active}   color="#22c55e" />
          <StatCard label="Pending"       value={summary.pending}  color="#f59e0b" />
          <StatCard label="Rejected"      value={summary.rejected} color="#ef4444" />
          <StatCard label="Expired"       value={summary.expired}  color="#6b7280" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[['ads','My Ads'], ['create','+ Create Ad'], ['payment','Submit Payment'], ['notifications','Notifications']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? '#e94560' : '#1e293b',
              color:      tab === t ? '#fff'    : '#94a3b8',
              border: `1px solid ${tab === t ? '#e94560' : '#334155'}`,
              borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
            }}>{l}{t === 'notifications' && notifications?.filter(n => !n.is_read).length > 0 && (
              <span style={{ background: '#e94560', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, marginLeft: 6 }}>
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}</button>
          ))}
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div style={{ marginTop: 32 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20, rotateY: -5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -20, rotateY: 5 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── My Ads Tab ─────────────────────────────────────── */}
              {tab === 'ads' && (
          <div>
            {ads.length === 0 ? (
              <EmptyState icon="📋" message="No ads yet. Create your first listing!" />
            ) : ads.map(ad => (
              <div key={ad.id} className="glass" style={{ borderRadius: 14, padding: 18, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#0f172a88', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {ad.status === 'published' ? '✅' : '⏳'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{ad.title}</div>
                      {ad.packages && <PackageBadge name={ad.packages.name} />}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 12 }}>
                      <span>{ad.categories?.name}</span>
                      <span>{ad.cities?.name}</span>
                      <span style={{ color: '#444' }}>|</span>
                      <span style={{ color: '#e94560', fontWeight: 600 }}>
                        {ad.status === 'submitted' && 'Processing Review...'}
                        {ad.status === 'payment_pending' && 'Ready for Payment'}
                        {ad.status === 'payment_submitted' && 'Verifying Payment...'}
                        {ad.status === 'published' && 'Live & Active'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={ad.status} />
                    {ad.status === 'payment_pending' && (
                      <button className="btn-primary" style={{ marginTop: 8, padding: '5px 12px', fontSize: 11, display: 'block', marginLeft: 'auto' }}
                        onClick={() => { setPayForm(f => ({ ...f, ad_id: ad.id })); setTab('payment'); }}>
                        Pay Now →
                      </button>
                    )}
                  </div>
                  <Link href={`/ads/${ad.slug}`} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>Details</Link>
                </div>
              </div>

            ))}
          </div>
        )}

        {/* ── Create Ad Tab ──────────────────────────────────── */}
        {tab === 'create' && (
          <div className="glass" style={{ padding: 40, borderRadius: 24, maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Step 1: Create Listing</h2>
              <div style={{ background: '#e9456022', color: '#e94560', border: '1px solid #e9456044', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>DRAFT</div>
            </div>
            <form onSubmit={handleCreateAd}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Ad Title *</label>
                <input className="input" value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} placeholder="e.g. iPhone 15 Pro Max 256GB" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Category *</label>
                  <select className="input" value={adForm.category_id} onChange={e => setAdForm({ ...adForm, category_id: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">City *</label>
                  <select className="input" value={adForm.city_id} onChange={e => setAdForm({ ...adForm, city_id: e.target.value })} required>
                    <option value="">Select city</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Price (optional)</label>
                <input className="input" value={adForm.price} onChange={e => setAdForm({ ...adForm, price: e.target.value })} placeholder="e.g. PKR 45,000 or Contact for price" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Description *</label>
                <textarea className="input" rows={5} value={adForm.description} onChange={e => setAdForm({ ...adForm, description: e.target.value })} placeholder="Describe your item in detail..." required style={{ resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="label">Media URLs (image or YouTube links)</label>
                {adForm.media_urls.map((url, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="input" value={url} onChange={e => { const m = [...adForm.media_urls]; m[i] = e.target.value; setAdForm({ ...adForm, media_urls: m }); }} placeholder="https://..." />
                    {adForm.media_urls.length > 1 && (
                      <button type="button" style={{ background: '#334155', border: 'none', borderRadius: 7, padding: '0 12px', color: '#94a3b8', cursor: 'pointer' }}
                        onClick={() => setAdForm({ ...adForm, media_urls: adForm.media_urls.filter((_, j) => j !== i) })}>✕</button>
                    )}
                  </div>
                ))}
                {adForm.media_urls.length < 5 && (
                  <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => setAdForm({ ...adForm, media_urls: [...adForm.media_urls, ''] })}>+ Add another URL</button>
                )}
              </div>
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                ℹ️ Your ad will be reviewed by our moderator team before going to the payment stage. Only approved ads go live.
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '11px 28px', fontSize: 14, borderRadius: 10 }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </form>
          </div>
        )}

        {/* ── Payment Tab ────────────────────────────────────── */}
        {tab === 'payment' && (
          <div className="glass" style={{ padding: 40, borderRadius: 24, maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 22 }}>Submit Payment Proof</h2>
            {pendingPaymentAds.length === 0 ? (
              <div style={{ padding: '20px 0' }}>
                {/* Progress Tracker UI */}
                <div style={{ background: '#0f172a88', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🚀</span> How to Go Live
                  </h3>
                  
                  {[
                    { s: 1, t: 'Create your listing', d: 'Enter your item details in the "New Listing" tab.', active: true },
                    { s: 2, t: 'Moderator Review', d: 'Our team verifies your content for safety and quality.' },
                    { s: 3, t: 'Payment Submission', d: 'Once approved, pay here to boost your ad.' },
                    { s: 4, t: 'Published!', d: 'Your ad goes live across the platform instantly.' },
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, position: 'relative' }}>
                      {i < 3 && <div style={{ position: 'absolute', left: 13, top: 30, bottom: -10, width: 2, background: '#334155' }} />}
                      <div style={{ 
                        width: 28, height: 28, borderRadius: 14, background: step.active ? '#e94560' : '#334155',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', zIndex: 1
                      }}>{step.s}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: step.active ? '#f1f5f9' : '#64748b' }}>{step.t}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{step.d}</div>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 12, pt: 12, borderTop: '1px solid #334155', paddingTop: 20 }}>
                    {router.query.pkg && (
                      <div style={{ background: '#f5a62315', border: '1px solid #f5a62333', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f5a623' }}>
                        🎯 You've selected the <strong>{packages.find(p => p.id === router.query.pkg)?.name || 'Premium'}</strong> package! Let's get your ad submitted first.
                      </div>
                    )}
                    <button className="btn-primary" style={{ width: '100%', padding: '12px 0' }} onClick={() => setTab('create')}>
                      Start Step 1: Create Ad →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePayment}>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Select Ad *</label>
                  <select className="input" value={payForm.ad_id} onChange={e => setPayForm({ ...payForm, ad_id: e.target.value })} required>
                    <option value="">Select ad awaiting payment</option>
                    {pendingPaymentAds.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Package *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {packages.map(pkg => {
                      const color = PKG_COLORS[pkg.name] || '#6b7280';
                      return (
                        <div key={pkg.id} onClick={() => setPayForm({ ...payForm, package_id: pkg.id })} style={{
                          border: `2px solid ${payForm.package_id === pkg.id ? color : '#334155'}`,
                          borderRadius: 10, padding: '12px 10px', cursor: 'pointer', textAlign: 'center',
                          background: payForm.package_id === pkg.id ? color + '15' : 'transparent',
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color }}>{pkg.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>PKR {Number(pkg.price).toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: '#475569' }}>{pkg.duration_days} days</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label className="label">Payment Method *</label>
                    <select className="input" value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                      {['EasyPaisa','JazzCash','Bank Transfer','Card'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Sender Name</label>
                    <input className="input" value={payForm.sender_name} onChange={e => setPayForm({ ...payForm, sender_name: e.target.value })} placeholder="Account holder name" />
                  </div>
                </div>

                {/* Instructions Box */}
                {['JazzCash','EasyPaisa'].includes(payForm.method) && (
                  <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b44', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{payForm.method === 'JazzCash' ? '📱' : '📲'}</span>
                      <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14 }}>{payForm.method} Payment Instructions</div>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                      1. Open your {payForm.method} App.<br/>
                      2. Transfer <strong style={{ color: '#fff' }}>PKR {Number(packages.find(p => p.id === payForm.package_id)?.price || 0).toLocaleString()}</strong> to:<br/>
                      <div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: 8, margin: '8px 0', display: 'inline-block', border: '1px solid #334155' }}>
                        <span style={{ fontSize: 10, color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Number</span>
                        <strong style={{ fontSize: 18, color: '#fff', letterSpacing: 1 }}>
                          {payForm.method === 'JazzCash' ? '03266999069' : '03156998454'}
                        </strong>
                      </div><br/>
                      3. Copy the <strong style={{ color: '#fff' }}>Transaction ID</strong> and paste it below.
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Transaction Reference *</label>
                  <input className="input" value={payForm.transaction_ref} onChange={e => setPayForm({ ...payForm, transaction_ref: e.target.value })} placeholder="e.g. EP-2024-789456" required />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label className="label">Screenshot URL (optional)</label>
                  <input className="input" value={payForm.screenshot_url} onChange={e => setPayForm({ ...payForm, screenshot_url: e.target.value })} placeholder="https://..." />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '11px 28px', fontSize: 14, borderRadius: 10 }} disabled={submitting}>
                  {submitting ? 'Submitting...' : '✓ Submit Payment'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Notifications Tab ──────────────────────────────── */}
        {tab === 'notifications' && (
          <div>
            {!notifications?.length ? (
              <EmptyState icon="🔔" message="No notifications yet." />
            ) : notifications.map(n => (
              <div key={n.id} style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 16, marginBottom: 10,
                display: 'flex', gap: 14, alignItems: 'flex-start',
                opacity: n.is_read ? 0.6 : 1,
              }}>
                <div style={{ fontSize: 20 }}>
                  {n.type === 'success' ? '✅' : n.type === 'danger' ? '❌' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 3, fontSize: 14 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
