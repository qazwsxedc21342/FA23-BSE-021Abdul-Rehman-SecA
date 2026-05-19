import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { adminAPI, moderatorAPI } from '../../utils/api';
import { StatusBadge, PackageBadge, StatCard, Spinner, EmptyState, PageHeader } from '../../components/UI';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('payments');
  const [payQueue, setPayQueue] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processed, setProcessed] = useState(new Set());
  const [revProcessed, setRevProcessed] = useState(new Set());
  const [scheduleMap, setScheduleMap] = useState({});
  const [notes, setNotes] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user && !['moderator', 'admin', 'superadmin'].includes(user.role)) { router.push('/'); return; }
    if (user) loadAll();
  }, [user, authLoading]);

  const loadAll = async () => {
    try {
      const [payRes, revRes, usrRes, logRes] = await Promise.all([
        adminAPI.getPaymentQueue(),
        moderatorAPI.getQueue(),
        adminAPI.getUsers(),
        adminAPI.getAuditLogs(),
      ]);
      setPayQueue(payRes.data.data || []);
      setReviewQueue(revRes.data.data || []);
      setUsers(usrRes.data.data || []);
      setAuditLogs(logRes.data.data || []);
    } catch (e) { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  const handleVerify = async (id, action) => {
    try {
      await adminAPI.verifyPayment(id, { action });
      setProcessed(prev => new Set([...prev, id]));
      toast.success(`Payment ${action}d`);

      // If verified, auto-publish
      if (action === 'verify') {
        const payment = payQueue.find(p => p.id === id);
        if (payment?.ads?.id) {
          await adminAPI.publishAd(payment.ads.id, { action: 'publish' });
          toast.success('Ad published automatically!');
        }
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const handleReview = async (id, action) => {
    try {
      await moderatorAPI.reviewAd(id, { action, note: notes[id] || '' });
      setRevProcessed(prev => new Set([...prev, id]));
      toast.success(`Ad content ${action}d`);
    } catch (err) { toast.error(err.response?.data?.message || 'Review failed'); }
  };

  const handleSchedule = async (adId) => {
    const dateStr = scheduleMap[adId];
    if (!dateStr) { toast.error('Please select a publish date'); return; }
    try {
      await adminAPI.publishAd(adId, { action: 'schedule', publish_at: dateStr });
      toast.success('Ad scheduled!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to schedule'); }
  };

  const handleUserStatus = async (id, status) => {
    try {
      await adminAPI.updateUserStatus(id, status);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
      toast.success(`User ${status}`);
    } catch (err) { toast.error('Failed to update user'); }
  };

  const handleVerifyUser = async (id) => {
    try {
      await adminAPI.verifyUser(id);
      setUsers(prev => prev.map(u => {
        if (u.id !== id) return u;
        const profs = Array.isArray(u.seller_profiles) ? u.seller_profiles : [u.seller_profiles || {}];
        if (profs[0]) profs[0].is_verified = true;
        return { ...u, seller_profiles: profs };
      }));
      toast.success('User verified');
    } catch (err) { toast.error('Verification failed'); }
  };

  const handleFeature = async (id) => {
    try {
      await adminAPI.featureAd(id);
      toast.success('Featured status toggled!');
    } catch (err) { toast.error('Failed'); }
  };

  const activePayQueue = payQueue.filter(p => !processed.has(p.id));
  const activeRevQueue = reviewQueue.filter(r => !revProcessed.has(r.id) && (r.title.toLowerCase().includes(search.toLowerCase()) || r.users?.name?.toLowerCase().includes(search.toLowerCase())));
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  if (authLoading || loading) return <div style={{ background: '#0f172a', minHeight: '100vh' }}><Spinner /></div>;

  const ROLE_COLORS = { client: '#3b82f6', moderator: '#8b5cf6', admin: '#f59e0b', superadmin: '#e94560' };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <div className="section">
        <PageHeader title="Admin Dashboard" sub="Manage payments, listings, and users" />

        {/* Stats - Glass Look */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Review Queue" value={activeRevQueue.length} color="#8b5cf6" style={{ background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(139, 92, 246, 0.2)' }} />
          <StatCard label="Payment Queue" value={activePayQueue.length} color="#f59e0b" style={{ background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 158, 11, 0.2)' }} />
          <StatCard label="Total Users" value={users.length} color="#3b82f6" style={{ background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.2)' }} />
        </div>

        {/* Global Search & Tabs Bar */}
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid #334155', borderRadius: 16, padding: '12px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['payments', '💳 Payments'], ['review', '📝 Reviews'], ['users', '👤 Users'], ['audit', '📋 Audit Log']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? '#e94560' : 'transparent',
                color: tab === t ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 500, cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>{l}</button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 14 }}>🔍</span>
            <input className="input" style={{ paddingLeft: 38, height: 38, background: '#0f172a88', border: '1px solid #33415588', fontSize: 13 }}
              placeholder={`Search ${tab === 'users' ? 'users...' : 'listings...'}`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div style={{ marginTop: 8 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20, rotateX: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* ── Payment Queue ──────────────────────────────────── */}
              {tab === 'payments' && (
                <div>
                  {activePayQueue.length === 0 ? (
                    <div style={{ background: '#1e293b', border: '1px solid #22c55e44', borderRadius: 14, padding: 48, textAlign: 'center' }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                      <div style={{ color: '#22c55e', fontWeight: 600 }}>All payments verified!</div>
                    </div>
                  ) : activePayQueue.map(p => (
                    <div key={p.id} className="glass" style={{ borderRadius: 16, padding: 24, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 18 }}>{p.ads?.title}</div>
                            {p.ads?.packages && <PackageBadge name={p.ads.packages.name} />}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, fontSize: 13, color: '#94a3b8' }}>
                            <div className="glass" style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.4)' }}>
                              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Seller</div>
                              <span style={{ color: '#e2e8f0' }}>{p.ads?.users?.name}</span>
                            </div>
                            <div className="glass" style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.4)' }}>
                              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Method</div>
                              <span style={{ color: '#e2e8f0' }}>{p.method}</span>
                            </div>
                            <div className="glass" style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.4)' }}>
                              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Reference</div>
                              <code style={{ color: '#f5a623' }}>{p.transaction_ref}</code>
                            </div>
                          </div>
                          {p.screenshot_url && (
                            <div style={{ marginTop: 16 }}>
                              <a href={p.screenshot_url} target="_blank" rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3b82f6', fontWeight: 600, padding: '6px 12px', background: '#3b82f611', borderRadius: 6, border: '1px solid #3b82f633' }}>
                                <span>🖼</span> View Payment Proof ↗
                              </a>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 200 }}>
                          <div style={{ fontSize: 32, fontWeight: 900, color: '#22c55e', marginBottom: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 500, marginRight: 4 }}>PKR</span>
                            {Number(p.amount).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 20 }}>Submitted {new Date(p.created_at).toLocaleString()}</div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button className="btn-primary" style={{ background: '#22c55e', width: '100%' }}
                              onClick={() => handleVerify(p.id, 'verify')}>✓ Approve & Publish</button>
                            <button className="btn-secondary" style={{ width: '100%', borderColor: '#ef444444', color: '#ef4444' }}
                              onClick={() => handleVerify(p.id, 'reject')}>✕ Reject Payment</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Review Queue ────────────────────────────────────── */}
              {tab === 'review' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {activeRevQueue.length === 0 ? (
                    <div className="glass" style={{ padding: 64, textAlign: 'center', borderRadius: 20 }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                      <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 18 }}>Queue Cleared!</div>
                      <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>No ads pending review.</div>
                    </div>
                  ) : activeRevQueue.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      className="glass"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ borderRadius: 20, padding: 28 }}
                    >
                      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="glass" style={{ width: 120, height: 90, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          {item.ad_media?.[0]?.thumbnail_url ? <img src={item.ad_media[0].thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>📷</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 19, marginBottom: 4 }}>{item.title}</div>
                              <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 12 }}>
                                <span>👤 {item.users?.name}</span>
                                <span>📂 {item.categories?.name}</span>
                                <span>📍 {item.cities?.name}</span>
                              </div>
                            </div>
                            <StatusBadge status={item.status} />
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                              onClick={() => handleReview(item.id, 'approve')}>✓ Approve Content</motion.button>
                            <button style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                              onClick={() => handleReview(item.id, 'reject')}>Reject</button>
                            <Link href={`/ads/${item.slug}`} target="_blank" className="btn-secondary" style={{ padding: '10px 24px', fontSize: 13 }}>Preview Ad ↗</Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ── Users ─────────────────────────────────────────── */}
              {tab === 'users' && (
                <div>
                  {filteredUsers.length === 0 ? (
                    <EmptyState message="No users found matching your search." />
                  ) : filteredUsers.map(u => (
                    <div key={u.id} className="glass" style={{ borderLeft: `4px solid ${u.role === 'admin' ? '#f5a623' : '#3b82f6'}`, borderRadius: 14, padding: 18, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 42, height: 42, borderRadius: 21, background: '#0f172a88', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#e94560', fontSize: 16 }}>
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{u.name}</div>
                            <span style={{ fontSize: 10, background: '#33415588', padding: '2px 8px', borderRadius: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5 }}>{u.role.toUpperCase()}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{u.email} · Joined {new Date(u.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {!u.is_verified && u.role === 'client' && (
                          <button onClick={() => handleVerifyUser(u.id)} className="btn-primary" style={{ padding: '7px 16px', fontSize: 12, background: '#22c55e' }}>
                            Verify User
                          </button>
                        )}
                        {u.is_verified && <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 16 }}>✓</span> VERIFIED
                        </span>}
                        <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: 12 }}>Manage</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Audit Log ─────────────────────────────────────── */}
              {tab === 'audit' && (
                <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#0f172a' }}>
                        {['Time', 'Actor', 'Action', 'Target'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 50).map((log, i) => (
                        <tr key={log.id} style={{ borderTop: '1px solid #334155', background: i % 2 === 0 ? 'transparent' : '#ffffff04' }}>
                          <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                          <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{log.users?.name || 'System'}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <code style={{ background: '#0f172a', color: '#86efac', padding: '2px 8px', borderRadius: 5, fontSize: 11 }}>{log.action_type}</code>
                          </td>
                          <td style={{ padding: '10px 16px', color: '#64748b', fontSize: 12 }}>{log.target_type} {log.target_id?.slice(0, 8)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
