import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { runQuery } from '../../lib/electionData'
import StatCard from '../../components/ui/StatCard'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Vote, Users, CheckSquare, Clock, Activity, TrendingUp, Bell, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData] = useState([
    { month: 'Jan', elections: 3, users: 45 },
    { month: 'Feb', elections: 5, users: 78 },
    { month: 'Mar', elections: 4, users: 62 },
    { month: 'Apr', elections: 8, users: 110 },
    { month: 'May', elections: 11, users: 145 },
    { month: 'Jun', elections: 7, users: 98 },
  ])

  useEffect(() => {
    fetchStats()
    fetchActivity()
  }, [])

  const fetchStats = async () => {
    try {
      const [
        { count: totalElections },
        { count: activeElections },
        { count: totalUsers },
        { count: pendingApprovals },
        { count: totalVotes },
      ] = await Promise.all([
        runQuery(supabase.from('elections').select('*', { count: 'exact', head: true }), 'Loading election count'),
        runQuery(supabase.from('elections').select('*', { count: 'exact', head: true }).eq('status', 'active'), 'Loading active elections'),
        runQuery(supabase.from('users').select('*', { count: 'exact', head: true }), 'Loading user count'),
        runQuery(supabase.from('creator_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'), 'Loading pending approvals'),
        runQuery(supabase.from('votes').select('*', { count: 'exact', head: true }), 'Loading vote count'),
      ])
      setStats({
        totalElections: totalElections || 0,
        activeElections: activeElections || 0,
        totalUsers: totalUsers || 0,
        pendingApprovals: pendingApprovals || 0,
        totalVotes: totalVotes || 0,
      })
    } catch {
      setStats({ totalElections: 0, activeElections: 0, totalUsers: 0, pendingApprovals: 0, totalVotes: 0 })
    } finally {
      setLoading(false)
    }
  }

  const fetchActivity = async () => {
    try {
      const { data } = await runQuery(
        supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8),
        'Loading audit logs'
      )
      setRecentActivity(data || [])
    } catch {
      setRecentActivity([])
    }
  }

  const actionColor = {
    login: 'bg-blue-100 text-blue-700',
    vote_cast: 'bg-green-100 text-green-700',
    election_created: 'bg-teal-100 text-teal-700',
    approval: 'bg-purple-100 text-purple-700',
    rejection: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Platform overview and management</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/approvals" className="btn-primary flex items-center gap-2 py-2">
            <UserCheck className="w-4 h-4" />
            {stats?.pendingApprovals > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {stats.pendingApprovals}
              </span>
            )}
            Approvals
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Elections"    value={loading ? '—' : stats?.totalElections}   icon={Vote}      color="blue"   loading={loading} trend="up" trendValue="+12% this month" />
        <StatCard title="Active Elections"   value={loading ? '—' : stats?.activeElections}  icon={Activity}  color="green"  loading={loading} />
        <StatCard title="Total Users"        value={loading ? '—' : stats?.totalUsers?.toLocaleString()}     icon={Users}     color="teal"   loading={loading} trend="up" trendValue="+8% this month" />
        <StatCard title="Pending Approvals"  value={loading ? '—' : stats?.pendingApprovals} icon={Clock}     color="orange" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-700 mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Elections per Month
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="elections" fill="url(#adminBar1)" radius={[6,6,0,0]} />
              <defs>
                <linearGradient id="adminBar1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-700 mb-5 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" /> User Growth
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Line type="monotone" dataKey="users" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-600" /> Recent Activity
            </h3>
            <Link to="/admin/audit" className="text-xs text-primary-600 font-medium hover:text-primary-800">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <motion.div key={item.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${actionColor[item.action] || 'bg-slate-100 text-slate-600'}`}>
                  {(item.action || 'action').replace('_', ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{item.details_json?.message || item.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.created_at ? format(new Date(item.created_at), 'MMM d, h:mm a') : 'Just now'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-700 mb-5">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Review Approvals', to: '/admin/approvals', icon: UserCheck, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
              { label: 'Manage Elections', to: '/admin/elections', icon: Vote,      color: 'text-primary-700 bg-primary-50 hover:bg-primary-100' },
              { label: 'View All Users',   to: '/admin/users',     icon: Users,     color: 'text-teal-700   bg-teal-50   hover:bg-teal-100' },
              { label: 'Audit Logs',       to: '/admin/audit',     icon: Activity,  color: 'text-slate-700  bg-slate-50  hover:bg-slate-100' },
              { label: 'Notifications',    to: '/admin/notifications', icon: Bell,  color: 'text-orange-700 bg-orange-50 hover:bg-orange-100' },
            ].map(({ label, to, icon: Icon, color }) => (
              <Link key={label} to={to}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${color}`}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const mockActivity = [
  { id: 1, action: 'login',            details_json: { message: 'Admin logged in' },          created_at: new Date().toISOString() },
  { id: 2, action: 'approval',         details_json: { message: 'Approved creator: Jane Doe' }, created_at: new Date(Date.now()-3600000).toISOString() },
  { id: 3, action: 'election_created', details_json: { message: 'Election "Student Council" created' }, created_at: new Date(Date.now()-7200000).toISOString() },
  { id: 4, action: 'vote_cast',        details_json: { message: 'Vote cast in Election #3' },  created_at: new Date(Date.now()-10800000).toISOString() },
  { id: 5, action: 'rejection',        details_json: { message: 'Rejected request from: Bob' }, created_at: new Date(Date.now()-14400000).toISOString() },
]

export default AdminDashboard
