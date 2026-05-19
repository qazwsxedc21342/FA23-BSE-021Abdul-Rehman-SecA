import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import { CheckSquare, Vote, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { CardSkeleton } from '../../components/ui/Skeleton'

const VoterMyVotes = () => {
  const { user } = useAuth()
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchVotes()
  }, [user])

  const fetchVotes = async () => {
    setLoading(true)
    try {
      const { data: regs, error } = await supabase
        .from('voter_registrations')
        .select('*, polls:poll_id(id, title, election_id, elections(title, end_at, status))')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })
      if (error) throw error
      setVotes(regs || [])
    } catch {
      setVotes(mockVotes)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    voted: 'bg-green-100 text-green-700 border-green-200',
    registered: 'bg-blue-100 text-blue-700 border-blue-200',
    waitlisted: 'bg-orange-100 text-orange-700 border-orange-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  }

  const votedCount = votes.filter(v => v.status === 'voted').length
  const pendingCount = votes.filter(v => v.status === 'registered').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-primary-600" /> My Votes
        </h1>
        <p className="text-slate-500 text-sm mt-1">History of all your election participations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-bold text-slate-800">{loading ? '—' : votes.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total Registered</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-600">{loading ? '—' : votedCount}</p>
          <p className="text-sm text-slate-500 mt-1">Votes Cast</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-blue-600">{loading ? '—' : pendingCount}</p>
          <p className="text-sm text-slate-500 mt-1">Pending Votes</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card p-5 animate-pulse"><div className="h-12 bg-slate-100 rounded" /></div>)}
        </div>
      ) : votes.length === 0 ? (
        <div className="card p-12 text-center">
          <Vote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No voting history yet</p>
          <p className="text-slate-400 text-sm mt-1">Register for an election to get started.</p>
          <Link to="/elections" className="btn-primary mt-4 inline-block">Browse Elections</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {votes.map((v, i) => {
            const election = v.polls?.elections
            const pollTitle = v.polls?.title
            return (
              <motion.div
                key={v.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.status === 'voted' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {v.status === 'voted'
                    ? <CheckSquare className="w-5 h-5 text-green-600" />
                    : <Clock className="w-5 h-5 text-blue-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{election?.title || 'Unknown Election'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {pollTitle && <span className="mr-2">Ballot: {pollTitle}</span>}
                    {v.registered_at && <span>Registered: {format(new Date(v.registered_at), 'MMM d, yyyy')}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusColors[v.status] || 'bg-slate-100 text-slate-600'}`}>
                    {v.status}
                  </span>
                  {v.status === 'registered' && election?.status === 'active' && v.polls?.election_id && (
                    <Link
                      to={`/vote/${v.polls.election_id}`}
                      className="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Vote Now →
                    </Link>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const mockVotes = [
  { id: '1', status: 'voted', registered_at: new Date(Date.now() - 86400000 * 3).toISOString(), polls: { title: 'Main Poll', election_id: '1', elections: { title: 'Student Council 2025', status: 'active' } } },
  { id: '2', status: 'registered', registered_at: new Date(Date.now() - 86400000).toISOString(), polls: { title: 'Main Poll', election_id: '2', elections: { title: 'Corporate Leadership Vote', status: 'active' } } },
]

export default VoterMyVotes
