import { useState, useEffect } from 'react';
import { useRouter }           from 'next/router';
import { moderatorAPI }        from '../../utils/api';
import { Spinner, EmptyState, StatCard, PageHeader } from '../../components/UI';
import { useAuth }             from '../../features/auth/AuthContext';
import toast                   from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div style={{ background: '#0f172a', minHeight: '100vh', paddingBottom: 60, perspective: 1200 }}>
      <div className="section">
        <PageHeader title="Moderation Terminal" sub="Review ecosystem listings and authenticate verified sellers" />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          {[
            { label: "Ads In Queue",     value: activeQueue.length,       color: "#f59e0b", delay: 0.1 },
            { label: "Processed Ads",    value: processed.size,           color: "#22c55e", delay: 0.2 },
            { label: "Pending Users",    value: pendingUsers.length,      color: "#60a5fa", delay: 0.3 }
          ].map(stat => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: stat.delay }}
              style={{ flex: '1 1 200px' }}
            >
              <StatCard label={stat.label} value={stat.value} color={stat.color} />
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 15, marginBottom: 24 }}>
          {['ads', 'users'].map((t) => (
            <motion.button 
              key={t}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(t)} 
              style={{ 
                background: activeTab === t ? '#e94560' : 'rgba(30, 41, 59, 0.4)', 
                border: '1px solid #334155', 
                padding: '12px 24px', 
                borderRadius: 12, 
                cursor: 'pointer', 
                fontWeight: 700, 
                color: '#f1f5f9', 
                boxShadow: activeTab === t ? '0 0 20px rgba(233, 69, 96, 0.3)' : 'none',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: 12
              }}
            >
              {t === 'ads' ? `Ad Queue (${activeQueue.length})` : `Pending Users (${pendingUsers.length})`}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, rotateX: 5 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -20, rotateX: -5 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'ads' && (
              activeQueue.length === 0 ? (
                <EmptyState icon="✅" message="Queue is empty — all caught up!" />
              ) : activeQueue.map((item, idx) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass" 
                  style={{ borderRadius: 20, padding: 28, marginBottom: 20, border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      
                    {/* Thumbnail */}
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      style={{ width: 140, height: 110, borderRadius: 14, overflow: 'hidden', background: '#0f172a', flexShrink: 0, boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
                    >
                      {item.ad_media?.[0]?.thumbnail_url ? (
                        <img src={item.ad_media[0].thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => e.target.style.display = 'none'} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 32 }}>📷</div>
                      )}
                    </motion.div>
      
                    {/* Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 20, marginBottom: 6, letterSpacing: -0.5 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, display: 'flex', gap: 18, flexWrap: 'wrap', fontWeight: 500 }}>
                        <span>👤 <span style={{ color: '#e94560' }}>{item.users?.name}</span></span>
                        <span>📂 {item.categories?.name}</span>
                        <span>📍 {item.cities?.name}</span>
                        <span>🕐 {item.submitted_at ? new Date(item.created_at).toLocaleString() : 'Recently'}</span>
                      </div>
      
                      {/* Description preview */}
                      <div style={{ fontSize: 14, color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, lineHeight: 1.6, border: '1px solid rgba(255,255,255,0.02)' }}>
                        {item.description || 'No description provided.'}
                      </div>
      
                      {/* Media validation checklist */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                        {item.ad_media?.map((m, i) => (
                          <span key={i} style={{
                            background: m.validation_status === 'valid' ? 'linear-gradient(45deg, #22c55e22, #22c55e44)' : 'linear-gradient(45deg, #ef444422, #ef444444)',
                            color: m.validation_status === 'valid' ? '#22c55e' : '#ef4444',
                            border: `1px solid ${m.validation_status === 'valid' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            padding: '4px 12px', borderRadius: 24, fontSize: 11, fontWeight: 700,
                          }}>
                            {m.validation_status === 'valid' ? '✓' : '✗'} MEDIA {i + 1} ({m.source_type.toUpperCase()})
                          </span>
                        ))}
                      </div>
      
                      {/* Notes */}
                      <textarea
                        className="input"
                        style={{ height: 60, resize: 'none', marginBottom: 18, fontSize: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}
                        placeholder="Add professional moderation notes..."
                        value={notes[item.id] || ''}
                        onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                      />
      
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 12 }}>
                        <motion.button 
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
                          onClick={() => handleReview(item.id, 'approve')}>APPROVE LISTING</motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                          onClick={() => handleReview(item.id, 'reject')}>REJECT</motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                          onClick={() => handleReview(item.id, 'flag')}>FLAG FOR REVIEW</motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
    
            {activeTab === 'users' && (
              pendingUsers.length === 0 ? (
                <EmptyState icon="🎉" message="All users verified" />
              ) : pendingUsers.map((u, idx) => (
                <motion.div 
                  key={u.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass" 
                  style={{ borderRadius: 20, padding: 32, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 18, marginBottom: 4 }}>
                      {u.seller_profiles?.length > 0 ? u.seller_profiles[0].display_name : u.seller_profiles?.display_name || u.name}
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{u.email} • Registered {new Date(u.created_at).toLocaleString()}</div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: '#2dd4bf' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVerifyUser(u.id)} 
                    style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}
                  >
                    AUTHENTICATE
                  </motion.button>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
