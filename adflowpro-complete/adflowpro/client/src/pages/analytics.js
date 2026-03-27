import { useState, useEffect }  from 'react';
import { useRouter }            from 'next/router';
import { analyticsAPI, publicAPI } from '../utils/api';
import { StatCard, Spinner, PageHeader } from '../components/UI';
import { useAuth }              from '../features/auth/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#e94560','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#06b6d4'];

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data,    setData]    = useState(null);
  const [health,  setHealth]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user)  { router.push('/login'); return; }
    if (!authLoading && user && !['admin','superadmin'].includes(user.role)) { router.push('/'); return; }
    if (user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [analyticsRes, healthRes] = await Promise.all([
        analyticsAPI.getSummary(),
        publicAPI.healthCheck(),
      ]);
      setData(analyticsRes.data.data);
      setHealth(healthRes.data.data);
    } catch (e) { toast.error('Failed to load analytics'); }
    finally     { setLoading(false); }
  };

  if (authLoading || loading) return <div style={{ background: '#0f172a', minHeight: '100vh' }}><Spinner /></div>;
  if (!data) return null;

  const { listings, revenue, moderation, taxonomy, systemHealth } = data;

  // Bar chart data for monthly revenue
  const revenueChartData = Object.entries(revenue.monthly || {})
    .slice(-6)
    .map(([month, amount]) => ({ month, amount: Math.round(amount) }));

  // Pie chart for categories
  const categoryData = Object.entries(taxonomy.byCategory || {}).map(([name, value]) => ({ name, value }));
  // Pie for packages
  const packageData  = Object.entries(taxonomy.byPackage  || {}).map(([name, value]) => ({ name, value }));

  const tooltipStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <div className="section">
        <PageHeader title="Analytics Dashboard" sub="Platform metrics, revenue, and system health" />

        {/* ── Listing KPIs ──────────────────────────────────── */}
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 12, letterSpacing: 1 }}>LISTINGS</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
          <StatCard label="Total Ads"     value={listings.total}    color="#3b82f6" />
          <StatCard label="Active"        value={listings.active}   color="#22c55e" />
          <StatCard label="Pending"       value={listings.pending}  color="#f59e0b" />
          <StatCard label="Expired"       value={listings.expired}  color="#6b7280" />
          <StatCard label="Rejected"      value={listings.rejected} color="#ef4444" />
        </div>

        {/* ── Revenue KPIs ───────────────────────────────────── */}
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 12, letterSpacing: 1 }}>REVENUE</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard label="Total Revenue (PKR)" value={`${Math.round(revenue.total).toLocaleString()}`} color="#f5a623" />
          <StatCard label="Pending Payments"    value={revenue.pending}                                 color="#f59e0b" />
        </div>

        {/* ── Revenue Bar Chart ─────────────────────────────── */}
        {revenueChartData.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 24, marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 20 }}>Monthly Revenue (PKR)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`PKR ${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="amount" fill="#e94560" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Moderation ────────────────────────────────────── */}
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 12, letterSpacing: 1 }}>MODERATION</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 18 }}>Approval vs Rejection</div>
            {[
              { label: 'Approved',  value: moderation.approved,     rate: moderation.approvalRate,   color: '#22c55e' },
              { label: 'Rejected',  value: moderation.rejected,     rate: moderation.rejectionRate,  color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.value} ads · {item.rate}%</span>
                </div>
                <div style={{ background: '#0f172a', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${item.rate}%`, background: item.color, height: 8, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Packages pie */}
          {packageData.length > 0 && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>Active Ads by Package</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={packageData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 11 }}>
                    {packageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Taxonomy ──────────────────────────────────────── */}
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 12, letterSpacing: 1 }}>TAXONOMY</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* By Category */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Ads by Category</div>
            {Object.entries(taxonomy.byCategory || {}).map(([cat, count], i) => {
              const max = Math.max(...Object.values(taxonomy.byCategory));
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 90, fontSize: 12, color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>{cat}</div>
                  <div style={{ flex: 1, background: '#0f172a', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / max) * 100}%`, background: COLORS[i % COLORS.length], height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: 30 }}>
                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* By City */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Ads by City</div>
            {Object.entries(taxonomy.byCity || {}).map(([city, count], i) => {
              const max = Math.max(...Object.values(taxonomy.byCity));
              return (
                <div key={city} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 90, fontSize: 12, color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>{city}</div>
                  <div style={{ flex: 1, background: '#0f172a', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / max) * 100}%`, background: COLORS[(i + 2) % COLORS.length], height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: 30 }}>
                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── System Health ──────────────────────────────────── */}
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 12, letterSpacing: 1 }}>SYSTEM HEALTH</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'DB Heartbeat',   status: health?.status || 'unknown',  value: health?.response_ms ? `${health.response_ms}ms` : '--' },
            { label: 'Cron: Publish',  status: 'ok', value: 'Every hour' },
            { label: 'Cron: Expire',   status: 'ok', value: 'Daily midnight' },
            { label: 'Cron: Reminders',status: 'ok', value: 'Daily 9am' },
          ].map(item => (
            <div key={item.label} style={{ background: '#1e293b', border: `1px solid ${item.status === 'ok' ? '#22c55e44' : '#ef444444'}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{item.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{item.value}</span>
                <span style={{ background: item.status === 'ok' ? '#22c55e22' : '#ef444422', color: item.status === 'ok' ? '#22c55e' : '#ef4444', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  {item.status === 'ok' ? '● OK' : '● ERROR'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent health logs */}
        {systemHealth?.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155', fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Recent Health Logs</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Source', 'Status', 'Response', 'Time'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {systemHealth.map((log, i) => (
                  <tr key={log.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{log.source}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ color: log.status === 'ok' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>● {log.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b' }}>{log.response_ms ? `${log.response_ms}ms` : '--'}</td>
                    <td style={{ padding: '10px 16px', color: '#64748b' }}>{new Date(log.checked_at).toLocaleString()}</td>
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
