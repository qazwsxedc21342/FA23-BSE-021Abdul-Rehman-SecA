import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart3, Trophy, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const COLORS = ['#2563eb', '#0d9488', '#7c3aed', '#ea580c', '#16a34a']

const VoterResults = () => {
  const { user } = useAuth()
  const [elections, setElections] = useState([])
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)

  useEffect(() => {
    if (user) fetchRegisteredElections()
  }, [user])

  const fetchRegisteredElections = async () => {
    setLoading(true)
    try {
      const { data: regs } = await supabase
        .from('voter_registrations')
        .select('polls:poll_id(election_id)')
        .eq('user_id', user.id)

      const electionIds = [...new Set((regs || []).map(r => r.polls?.election_id).filter(Boolean))]

      if (electionIds.length > 0) {
        const { data } = await supabase
          .from('elections')
          .select('id, title, status')
          .in('id', electionIds)
          .in('status', ['active', 'completed'])
        setElections(data || [])
        if (data?.length > 0) fetchResults(data[0].id)
      } else {
        setElections([])
      }
    } catch {
      toast.error('Failed to load elections')
    } finally {
      setLoading(false)
    }
  }

  const fetchResults = async (electionId) => {
    setSelected(electionId)
    setLoadingResults(true)
    try {
      const { data: polls } = await supabase
        .from('polls')
        .select('id, title, candidates(id, name, designation)')
        .eq('election_id', electionId)

      if (!polls?.length) { setResults([]); return }

      const enriched = await Promise.all(polls.map(async poll => {
        const candidates = await Promise.all((poll.candidates || []).map(async c => {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('candidate_id', c.id)
          return { ...c, votes: count || 0 }
        }))
        const sorted = [...candidates].sort((a, b) => b.votes - a.votes)
        const total = sorted.reduce((s, c) => s + c.votes, 0)
        return { ...poll, candidates: sorted, totalVotes: total }
      }))
      setResults(enriched)
    } catch {
      toast.error('Failed to load results')
    } finally {
      setLoadingResults(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-600" /> Election Results
        </h1>
        <p className="text-slate-500 text-sm mt-1">View results for elections you've participated in</p>
      </div>

      {loading ? (
        <div className="card p-8 animate-pulse"><div className="h-5 bg-slate-100 rounded w-1/2" /></div>
      ) : elections.length === 0 ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No results available yet.</p>
          <p className="text-xs text-slate-400 mt-1">Register and vote in active elections to view results.</p>
          <Link to="/elections" className="btn-primary mt-4 inline-block">Browse Elections</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {elections.map(el => (
              <button
                key={el.id}
                onClick={() => fetchResults(el.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  selected === el.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400'
                }`}
              >
                {el.title}
              </button>
            ))}
          </div>

          {loadingResults ? (
            <div className="card p-8 text-center"><RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" /></div>
          ) : results.length === 0 ? (
            <div className="card p-10 text-center"><p className="text-slate-500">No results data available yet.</p></div>
          ) : results.map(poll => (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-800 text-lg">{poll.title}</h3>
                <span className="text-sm text-slate-500">{poll.totalVotes} total votes</span>
              </div>

              {poll.candidates[0]?.votes > 0 && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                  <Trophy className="w-6 h-6 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Leading</p>
                    <p className="font-bold text-slate-800">{poll.candidates[0].name}</p>
                  </div>
                  <span className="ml-auto font-bold text-yellow-600 text-xl">{poll.candidates[0].votes}</span>
                </div>
              )}

              {poll.candidates.length > 0 && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={poll.candidates} barSize={32} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
                    <Tooltip formatter={(v) => [v, 'Votes']} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                    <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                      {poll.candidates.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          ))}
        </>
      )}
    </div>
  )
}

export default VoterResults
