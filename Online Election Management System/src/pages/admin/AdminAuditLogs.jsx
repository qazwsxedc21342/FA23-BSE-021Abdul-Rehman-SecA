import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Activity, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const actionColors = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-slate-100 text-slate-600',
  vote_cast: 'bg-green-100 text-green-700',
  election_created: 'bg-teal-100 text-teal-700',
  election_updated: 'bg-cyan-100 text-cyan-700',
  approval: 'bg-purple-100 text-purple-700',
  rejection: 'bg-red-100 text-red-700',
  register: 'bg-orange-100 text-orange-700',
}

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    fetchLogs()
  }, [page])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, users:actor_id(name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      const { data, error } = await query
      if (error) throw error
      setLogs(data || [])
    } catch {
      // Use mock data if table doesn't exist yet
      setLogs(mockLogs)
    } finally {
      setLoading(false)
    }
  }

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.details_json?.message?.toLowerCase().includes(search.toLowerCase()) ||
      log.users?.name?.toLowerCase().includes(search.toLowerCase())
    const matchAction = actionFilter === 'all' || log.action === actionFilter
    return matchSearch && matchAction
  })

  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary-600" /> Audit Logs
        </h1>
        <p className="text-slate-500 text-sm mt-1">Complete history of all actions taken on the platform</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            if (filtered.length === 0) return toast.error('No logs to export')
            const csv = [
              ['Action', 'Actor Name', 'Actor Email', 'Details', 'Timestamp'],
              ...filtered.map(log => [
                log.action,
                log.users?.name || 'System',
                log.users?.email || '',
                `"${log.details_json?.message || ''}"`,
                log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy h:mm a') : ''
              ])
            ].map(row => row.join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Audit logs exported successfully')
          }}
          className="btn-primary py-2 px-4 text-sm"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          <option value="all">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
              <th className="p-4 font-semibold">Action</th>
              <th className="p-4 font-semibold">Actor</th>
              <th className="p-4 font-semibold">Details</th>
              <th className="p-4 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="4" className="p-4">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-slate-500 italic">No audit logs found.</td>
              </tr>
            ) : filtered.map((log, i) => (
              <motion.tr
                key={log.id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="p-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>
                    {(log.action || '').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium text-slate-800">{log.users?.name || 'System'}</p>
                  <p className="text-xs text-slate-400">{log.users?.email || ''}</p>
                </td>
                <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={log.details_json?.message}>
                  {log.details_json?.message || '—'}
                </td>
                <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                  {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy h:mm a') : '—'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{filtered.length} entries shown</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < PAGE_SIZE}
            className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

const mockLogs = [
  { id: 1, action: 'login', users: { name: 'Ahmar', email: 'ahmar@test.com' }, details_json: { message: 'Admin logged in successfully' }, created_at: new Date().toISOString() },
  { id: 2, action: 'approval', users: { name: 'Ahmar', email: 'ahmar@test.com' }, details_json: { message: 'Approved creator request from Jane Doe' }, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, action: 'election_created', users: { name: 'Jane Doe', email: 'jane@test.com' }, details_json: { message: 'Election "Student Council 2025" created' }, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, action: 'vote_cast', users: { name: 'John Smith', email: 'john@test.com' }, details_json: { message: 'Vote cast in Student Council 2025' }, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 5, action: 'rejection', users: { name: 'Ahmar', email: 'ahmar@test.com' }, details_json: { message: 'Rejected request from: Bob' }, created_at: new Date(Date.now() - 14400000).toISOString() },
]

export default AdminAuditLogs
