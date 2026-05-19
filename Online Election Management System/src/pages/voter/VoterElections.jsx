import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { fetchVisibleElections, getErrorMessage, registerForElection, runQuery } from '../../lib/electionData'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { CardSkeleton } from '../../components/ui/Skeleton'
import ElectionCard from '../../components/elections/ElectionCard'
import { Vote, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

const VoterElections = () => {
  const { user } = useAuth()
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [registeredIds, setRegisteredIds] = useState(new Set())
  const [registering, setRegistering] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchElections()
      fetchRegistrations()
    }
  }, [user])

  const fetchElections = async () => {
    setLoading(true)
    setError('')
    try {
      setElections(await fetchVisibleElections({ orderBy: 'created_at' }))
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load elections')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async () => {
    try {
      const { data: regs } = await runQuery(
        supabase
          .from('voter_registrations')
          .select('polls:poll_id(election_id)')
          .eq('user_id', user.id),
        'Loading your election registrations'
      )
      const ids = new Set((regs || []).map(r => r.polls?.election_id).filter(Boolean))
      setRegisteredIds(ids)
    } catch {}
  }

  const handleRegister = async (electionId) => {
    setRegistering(electionId)
    try {
      const election = elections.find(item => item.id === electionId)
      const { data: polls } = await runQuery(
        supabase
          .from('polls')
          .select('id')
          .eq('election_id', electionId),
        'Loading election polls'
      )

      const result = await registerForElection({ election, polls, userId: user.id })
      setRegisteredIds(prev => new Set([...prev, electionId]))
      toast.success(
        result.status === 'waitlisted'
          ? 'Election is full. You have been added to the waitlist.'
          : result.alreadyRegistered
            ? 'You are already registered for this election.'
            : 'Successfully registered. Your Secret ID is available on your dashboard.'
      )
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to register'))
    } finally {
      setRegistering(null)
    }
  }

  const filtered = elections.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Vote className="w-6 h-6 text-primary-600" /> Available Elections
        </h1>
        <p className="text-slate-500 text-sm mt-1">Browse and register for upcoming and active elections</p>
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
          className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
        >
          <option value="all">All</option>
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
        <div className="card p-12 text-center">
          <Vote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No elections available at the moment.</p>
          <p className="text-xs text-slate-400 mt-1">Check back later for new elections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((el, i) => (
            <div key={el.id} className="relative">
              <ElectionCard election={el} index={i} />
              <div className="mt-3">
                {registeredIds.has(el.id) ? (
                  el.status === 'active' ? (
                    <Link
                      to={`/vote/${el.id}`}
                      className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    >
                      Vote Now →
                    </Link>
                  ) : (
                    <div className="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
                      ✓ Registered
                    </div>
                  )
                ) : el.status !== 'completed' ? (
                  <button
                    onClick={() => handleRegister(el.id)}
                    disabled={registering === el.id}
                    className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {registering === el.id ? 'Registering...' : 'Register to Vote'}
                  </button>
                ) : (
                  <div className="w-full text-center py-2.5 rounded-xl text-sm text-slate-500 bg-slate-100">
                    Election Ended
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VoterElections
