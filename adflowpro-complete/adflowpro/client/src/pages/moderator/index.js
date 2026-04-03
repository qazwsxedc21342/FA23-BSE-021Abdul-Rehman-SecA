import { useState, useEffect } from 'react';
import { useRouter }           from 'next/router';
import { moderatorAPI }        from '../../utils/api';
import { Spinner, EmptyState, StatCard, PageHeader } from '../../components/UI';
import { useAuth }             from '../../features/auth/AuthContext';
import toast                   from 'react-hot-toast';

export default function ModeratorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [queue,        setQueue]        = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [notes,        setNotes]        = useState({});
  const [processed,    setProcessed]    = useState(new Set());
  const [activeTab,    setActiveTab]    = useState('ads');

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user && !['moderator','admin','superadmin'].includes(user.role)) { router.push('/'); return; }
    if (user) {
      fetchQueue();
      fetchPendingUsers();
    }
  }, [user, authLoading]);

  const fetchQueue = async () => {
    try {
      const res = await moderatorAPI.getQueue();
      setQueue(res.data.data || []);
    } catch (e) { toast.error('Failed to load queue'); }
    finally     { setLoading(false); }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await moderatorAPI.getPendingUsers();
      setPendingUsers(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const handleReview = async (id, action) => {
    try {
      await moderatorAPI.reviewAd(id, { action, note: notes[id] || '' });
      setProcessed(prev => new Set([...prev, id]));
      toast.success(`Ad ${action}d successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleVerifyUser = async (id) => {
    try {
      await moderatorAPI.verifyUser(id);
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User verified successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const activeQueue = queue.filter(q => !processed.has(q.id));

  if (authLoading || loading) return <div style={{ background: '#0f172a', minHeight: '100vh' }}><Spinner /></div>;

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <div className="section">
        <PageHeader title="Moderator Dashboard" sub="Review pending ads and verify newly registered users" />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatCard label="Ads In Queue"     value={activeQueue.length}       color="#f59e0b" />
          <StatCard label="Processed Ads"    value={processed.size}           color="#22c55e" />
          <StatCard label="Pending Users"    value={pendingUsers.length}      color="#60a5fa" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
          <button onClick={() => setActiveTab('ads')} style={{ background: activeTab === 'ads' ? '#e94560' : '#1e293b', border: '1px solid #334155', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#f1f5f9', transition: 'all 0.2s' }}>
            Ad Queue ({activeQueue.length})
          </button>
          <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#e94560' : '#1e293b', border: '1px solid #334155', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#f1f5f9', transition: 'all 0.2s' }}>
            Pending Users ({pendingUsers.length})
          </button>
        </div>

        {activeTab === 'ads' && (
          activeQueue.length === 0 ? (
            <div style={{ background: '#1e293b', border: '1px solid #22c55e44', borderRadius: 14, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, color: '#22c55e', fontWeight: 600 }}>Queue is empty — all caught up!</div>
            </div>
          ) : activeQueue.map(item => (
            <div key={item.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 22, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
  
                {/* Thumbnail */}
                <div style={{ width: 110, height: 88, borderRadius: 10, overflow: 'hidden', background: '#0f172a', flexShrink: 0 }}>
                  {item.ad_media?.[0]?.thumbnail_url ? (
                    <img src={item.ad_media[0].thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 24 }}>📷</div>
                  )}
                </div>
  
                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span>👤 {item.users?.name} ({item.users?.email})</span>
                    <span>📂 {item.categories?.name}</span>
                    <span>📍 {item.cities?.name}</span>
                    <span>🕐 {item.submitted_at ? new Date(item.created_at).toLocaleString() : 'Recently'}</span>
                  </div>
  
                  {/* Description preview */}
                  <div style={{ fontSize: 13, color: '#94a3b8', background: '#0f172a', borderRadius: 8, padding: '10px 12px', marginBottom: 12, lineHeight: 1.6, maxHeight: 60, overflow: 'hidden' }}>
                    {item.description || 'No description provided.'}
                  </div>
  
                  {/* Media validation checklist */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {['Title OK', 'Description OK', 'Category OK', 'City OK'].map(check => (
                      <span key={check} style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>✓ {check}</span>
                    ))}
                    {item.ad_media?.map((m, i) => (
                      <span key={i} style={{
                        background: m.validation_status === 'valid' ? '#22c55e22' : '#ef444422',
                        color: m.validation_status === 'valid' ? '#22c55e' : '#ef4444',
                        border: `1px solid ${m.validation_status === 'valid' ? '#22c55e44' : '#ef444444'}`,
                        padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {m.validation_status === 'valid' ? '✓' : '✗'} Media {i + 1} ({m.source_type})
                      </span>
                    ))}
                  </div>
  
                  {/* Notes */}
                  <textarea
                    className="input"
                    style={{ height: 48, resize: 'none', marginBottom: 12, fontSize: 13 }}
                    placeholder="Add moderation notes (optional)..."
                    value={notes[item.id] || ''}
                    onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                  />
  
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => handleReview(item.id, 'approve')}>✓ Approve → Payment</button>
                    <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => handleReview(item.id, 'reject')}>✕ Reject</button>
                    <button style={{ background: '#f59e0b', color: '#1a1a2e', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => handleReview(item.id, 'flag')}>⚑ Flag</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {activeTab === 'users' && (
          pendingUsers.length === 0 ? (
            <div style={{ background: '#1e293b', border: '1px solid #22c55e44', borderRadius: 14, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, color: '#22c55e', fontWeight: 600 }}>All users verified!</div>
            </div>
          ) : pendingUsers.map(u => (
            <div key={u.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 22, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16, marginBottom: 4 }}>
                  {u.seller_profiles?.length > 0 ? u.seller_profiles[0].display_name : u.seller_profiles?.display_name || u.name}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{u.email} • Registered {new Date(u.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => handleVerifyUser(u.id)} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>
                Verify User
              </button>
            </div>
          ))
        )}

      </div>
    </div>
  );
}

