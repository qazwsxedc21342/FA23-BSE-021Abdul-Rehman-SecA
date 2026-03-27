import { useState, useEffect } from 'react';
import { useRouter }           from 'next/router';
import { adminAPI }            from '../../utils/api';
import { StatusBadge, PackageBadge, StatCard, Spinner, EmptyState, PageHeader } from '../../components/UI';
import { useAuth }             from '../../features/auth/AuthContext';
import toast                   from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab,        setTab]        = useState('payments');
  const [payQueue,   setPayQueue]   = useState([]);
  const [users,      setUsers]      = useState([]);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [processed,  setProcessed]  = useState(new Set());
  const [scheduleMap,setScheduleMap]= useState({});

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user && !['admin','superadmin'].includes(user.role)) { router.push('/'); return; }
    if (user) loadAll();
  }, [user, authLoading]);

  const loadAll = async () => {
    try {
      const [payRes, usrRes, logRes] = await Promise.all([
        adminAPI.getPaymentQueue(),
        adminAPI.getUsers(),
        adminAPI.getAuditLogs(),
      ]);
      setPayQueue(payRes.data.data  || []);
      setUsers(usrRes.data.data     || []);
      setAuditLogs(logRes.data.data || []);
    } catch (e) { toast.error('Failed to load admin data'); }
    finally     { setLoading(false); }
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

  const handleFeature = async (id) => {
    try {
      await adminAPI.featureAd(id);
      toast.success('Featured status toggled!');
    } catch (err) { toast.error('Failed'); }
  };

  const activeQueue = payQueue.filter(p => !processed.has(p.id));

  if (authLoading || loading) return <div style={{ background: '#0f172a', minHeight: '100vh' }}><Spinner /></div>;

  const ROLE_COLORS = { client: '#3b82f6', moderator: '#8b5cf6', admin: '#f59e0b', superadmin: '#e94560' };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <div className="section">
        <PageHeader title="Admin Dashboard" sub="Manage payments, listings, and users" />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatCard label="Payment Queue"  value={activeQueue.length} color="#f59e0b" />
          <StatCard label="Total Users"    value={users.length}       color="#3b82f6" />
          <StatCard label="Audit Events"   value={auditLogs.length}   color="#8b5cf6" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[['payments','💳 Payments'], ['users','👤 Users'], ['audit','📋 Audit Log']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? '#e94560' : '#1e293b',
              color:      tab === t ? '#fff'    : '#94a3b8',
              border: `1px solid ${tab === t ? '#e94560' : '#334155'}`,
              borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>

        {/* ── Payment Queue ──────────────────────────────────── */}
        {tab === 'payments' && (
          <div>
            {activeQueue.length === 0 ? (
              <div style={{ background: '#1e293b', border: '1px solid #22c55e44', borderRadius: 14, padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                <div style={{ color: '#22c55e', fontWeight: 600 }}>All payments verified!</div>
              </div>
            ) : activeQueue.map(p => (
              <div key={p.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 22, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16, marginBottom: 6 }}>{p.ads?.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#64748b' }}>
                      <span>👤 Seller: {p.ads?.users?.name} ({p.ads?.users?.email})</span>
                      <span>💰 Method: {p.method}</span>
                      <span>🔑 Ref: <code style={{ color: '#f5a623', background: '#0f172a', padding: '1px 6px', borderRadius: 4 }}>{p.transaction_ref}</code></span>
                      {p.sender_name && <span>📛 Sender: {p.sender_name}</span>}
                      <span>⏰ Submitted: {new Date(p.created_at).toLocaleString()}</span>
                      {p.ads?.packages && <span>📦 Package: <PackageBadge name={p.ads.packages.name} /></span>}
                    </div>
                    {p.screenshot_url && (
                      <a href={p.screenshot_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#60a5fa' }}>
                        📷 View screenshot →
                      </a>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#f5a623', marginBottom: 14 }}>
                      PKR {Number(p.amount).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <button style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => handleVerify(p.id, 'verify')}>✓ Verify & Publish</button>
                      <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => handleVerify(p.id, 'reject')}>✕ Reject</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <input type="datetime-local" className="input" style={{ width: 180, fontSize: 12 }}
                        value={scheduleMap[p.ads?.id] || ''}
                        onChange={e => setScheduleMap(s => ({ ...s, [p.ads?.id]: e.target.value }))} />
                      <button style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => handleSchedule(p.ads?.id)}>Schedule</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Users ─────────────────────────────────────────── */}
        {tab === 'users' && (
          <div>
            {users.map(u => (
              <div key={u.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 19, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#e94560', fontSize: 15 }}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{u.email} · Joined {new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: (ROLE_COLORS[u.role] || '#6b7280') + '22', color: ROLE_COLORS[u.role] || '#6b7280', border: `1px solid ${ROLE_COLORS[u.role] || '#6b7280'}44`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{u.role}</span>
                  <span style={{ background: u.status === 'active' ? '#22c55e22' : '#ef444422', color: u.status === 'active' ? '#22c55e' : '#ef4444', border: `1px solid ${u.status === 'active' ? '#22c55e44' : '#ef444444'}`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{u.status}</span>
                  {u.status === 'active' ? (
                    <button style={{ background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                      onClick={() => handleUserStatus(u.id, 'suspended')}>Suspend</button>
                  ) : (
                    <button style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                      onClick={() => handleUserStatus(u.id, 'active')}>Reactivate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Audit Log ─────────────────────────────────────── */}
        {tab === 'audit' && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
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

      </div>
    </div>
  );
}
