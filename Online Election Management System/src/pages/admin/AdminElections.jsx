import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getErrorMessage, runQuery } from '../../lib/electionData'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Vote, Search, Plus, Eye, PlayCircle, PauseCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: PauseCircle },
  published: { label: 'Published', color: 'bg-blue-100 text-blue-700', icon: Eye },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: PlayCircle },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
}

const AdminElections = () => {
  const { user } = useAuth()
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchElections() }, [])

  const fetchElections = async () => {
    setLoading(true)
    try {
      const { data } = await runQuery(
        supabase
          .from('elections')
          .select('*, users:creator_id(name, email)')
          .order('created_at', { ascending: false }),
        'Loading elections'
      )
      setElections(data || [])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load elections'))
      setElections([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await runQuery(
        supabase.from('elections').update({ status: newStatus }).eq('id', id),
        'Updating election status'
      )
      setElections(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
      toast.success('Election status updated')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update status'))
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete election "${title}"? This action cannot be undone.`)) return
    try {
      await runQuery(
        supabase.from('elections').delete().eq('id', id),
        'Deleting election'
      )
      setElections(prev => prev.filter(e => e.id !== id))
      toast.success('Election deleted')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete election'))
    }
  }

  const filtered = elections.filter(e => {
    const matchSearch = !search ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.users?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Vote className="w-6 h-6 text-primary-600" /> All Elections
          </h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and manage all platform elections</p>
        </div>
        <Link
          to="/admin/elections/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Election
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const Icon = cfg.icon
          const count = elections.filter(e => e.status === key).length
          return (
            <div key={key} className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{loading ? '—' : count}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search elections..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
              <th className="p-4 font-semibold">Election</th>
              <th className="p-4 font-semibold">Creator</th>
              <th className="p-4 font-semibold">Timeline</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
              <th className="p-4 font-semibold text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="5" className="p-4"><div className="h-5 bg-slate-100 rounded w-2/3" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center">
                  <Vote className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 italic">No elections found.</p>
                </td>
              </tr>
            ) : filtered.map((el, i) => {
              const cfg = statusConfig[el.status] || statusConfig.draft
              const StatusIcon = cfg.icon
              return (
                <motion.tr
                  key={el.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    <p className="font-semibold text-slate-800 text-sm">{el.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{el.category}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-slate-700">{el.users?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{el.users?.email}</p>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {el.start_at ? (
                      <>
                        <p>{format(new Date(el.start_at), 'MMM d, yyyy')}</p>
                        <p className="text-slate-400">→ {el.end_at ? format(new Date(el.end_at), 'MMM d, yyyy') : '—'}</p>
                      </>
                    ) : '—'}
                  </td>
                  <td className="p-4">
                    <select
                      value={el.status}
                      onChange={e => handleStatusChange(el.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${cfg.color}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/elections/${el.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-800"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(el.id, el.title)}
                      className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                      title="Delete election"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminElections
