import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getRuntimeStatus, runQuery } from '../../lib/electionData'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import ElectionCard from '../../components/elections/ElectionCard'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { Vote, Search } from 'lucide-react'

const CreatorElections = () => {
  const { user } = useAuth()
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (user) fetchElections()
  }, [user])

  const fetchElections = async () => {
    setLoading(true)
    try {
      const { data } = await runQuery(
        supabase
          .from('elections')
          .select('*, polls(id)')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        'Loading creator elections'
      )
      const enriched = (data || []).map(el => {
        const status = getRuntimeStatus(el)
        return { ...el, status }
      })
      setElections(enriched)
    } catch {
      toast.error('Failed to load elections')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this election?')) return
    try {
      await runQuery(
        supabase.from('elections').delete().eq('id', id),
        'Deleting election'
      )
      setElections(prev => prev.filter(e => e.id !== id))
      toast.success('Election deleted')
    } catch {
      toast.error('Failed to delete election')
    }
  }

  const filtered = elections.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Vote className="w-6 h-6 text-primary-600" /> My Elections
          </h1>
          <p className="text-slate-500 text-sm mt-1">All elections you have created</p>
          <p className="text-primary-700 text-xs mt-1">To add candidates, open an election and click "Manage Candidates".</p>
        </div>
        <Link to="/creator/elections/new" className="btn-primary flex items-center gap-2">
          + Create Election
        </Link>
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
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <Vote className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-display font-semibold text-slate-700 mb-2">No elections found</h3>
          <p className="text-slate-500 text-sm mb-5">Create your first election to get started.</p>
          <Link to="/creator/elections/new" className="btn-primary">Create Election</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((el, i) => (
            <div key={el.id} className="relative">
              <ElectionCard election={el} index={i} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/creator/elections/${el.id}/candidates`}
                  className="px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  Manage Candidates
                </Link>
                <button
                  onClick={() => handleDelete(el.id)}
                  className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CreatorElections
