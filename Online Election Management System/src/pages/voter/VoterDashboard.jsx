import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { getErrorMessage, getRuntimeStatus, runQuery } from '../../lib/electionData'
import { useAuth } from '../../contexts/AuthContext'
import StatCard from '../../components/ui/StatCard'
import { CardSkeleton } from '../../components/ui/Skeleton'
import ElectionCard from '../../components/elections/ElectionCard'
import { Vote, CheckSquare, Search, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const VoterDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [registeredPolls, setRegisteredPolls] = useState([])
  const [secretIds, setSecretIds] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        setError('')
        await Promise.all([fetchStats(), fetchRegisteredPolls()])
      } catch (error) {
        console.error('Data load error:', error)
        setError(getErrorMessage(error, 'Dashboard data could not be loaded.'))
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [user])

  const fetchStats = async () => {
    try {
      const [registeredResult, votedResult, secretsResult] = await Promise.allSettled([
        runQuery(supabase.from('voter_registrations').select('*', { count: 'exact', head: true }).eq('user_id', user.id), 'Loading registered polls'),
        runQuery(supabase.from('voter_registrations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'voted'), 'Loading votes cast'),
        runQuery(supabase.from('secret_ids').select('poll_id, hashed_secret, masked_secret').eq('user_id', user.id), 'Loading secret IDs')
      ])
      
      setStats({
        registeredPolls: registeredResult.status === 'fulfilled' ? registeredResult.value.count || 0 : 0,
        votesCast: votedResult.status === 'fulfilled' ? votedResult.value.count || 0 : 0,
      })

      if (secretsResult.status === 'fulfilled') {
        const secretsMap = {}
        ;(secretsResult.value.data || []).forEach(secret => {
          secretsMap[secret.poll_id] = secret.hashed_secret || secret.masked_secret
        })
        setSecretIds(secretsMap)
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
      setStats({ registeredPolls: 0, votesCast: 0 })
    }
  }

  const fetchRegisteredPolls = async () => {
    try {
      // Fetch registrations
      const { data: regs } = await runQuery(
        supabase
          .from('voter_registrations')
          .select('poll_id, status')
          .eq('user_id', user.id),
        'Loading your registrations'
      )

      if (regs?.length > 0) {
        const pollIds = regs.map(r => r.poll_id)
        
        // Fetch corresponding elections
        const { data: polls } = await runQuery(
          supabase
            .from('polls')
            .select('id, election_id, elections(*)')
            .in('id', pollIds),
          'Loading registered elections'
        )
          
        if (polls) {
           const elections = polls.map(p => {
               const el = p.elections
               if (!el) return null
               const status = getRuntimeStatus(el)
               // Add registration status specific to this user
               const reg = regs.find(r => r.poll_id === p.id)
               return { ...el, db_status: el.status, status, voter_status: reg?.status || 'registered', poll_id: p.id }
           }).filter(Boolean)
           // Deduplicate if multiple polls per election (simplified for now)
           const uniqueElections = Array.from(new Map(elections.map(item => [item['id'], item])).values());
           setRegisteredPolls(uniqueElections)
           return
        }
      }
      
      // No registrations found
      setRegisteredPolls([])
    } catch (error) {
      console.error('Polls fetch error:', error)
      setRegisteredPolls([])
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Voter Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your registrations and cast your votes</p>
        </div>
        <Link to="/elections" className="btn-primary flex items-center justify-center gap-2">
          <Search className="w-4 h-4" /> Find Elections
        </Link>
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard title="Registered Polls" value={loading ? '—' : stats?.registeredPolls} icon={Vote}        color="blue"  loading={loading} />
        <StatCard title="Votes Cast"       value={loading ? '—' : stats?.votesCast}       icon={CheckSquare} color="green" loading={loading} />
      </div>

      {/* My Elections */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold text-slate-800">My Elections</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : registeredPolls.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Vote className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="font-display font-semibold text-slate-800 mb-2">No registrations found</h3>
             <p className="text-slate-500 text-sm mb-6 max-w-md">You haven't registered for any elections yet. Browse active elections to participate.</p>
             <Link to="/elections" className="btn-primary">Browse Elections</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registeredPolls.map((el, i) => (
              <div key={el.id} className="relative">
                 <ElectionCard election={el} index={i} />
                 {/* Overlay badge for vote status */}
                 <div className="absolute top-4 right-4 z-10">
                    {el.voter_status === 'voted' ? (
                       <span className="badge bg-green-500 text-white shadow-sm border border-green-600">
                          <CheckSquare className="w-3 h-3 mr-1" /> Voted
                       </span>
                    ) : el.status === 'active' ? (
                       <span className="badge bg-primary-500 text-white shadow-sm border border-primary-600 animate-pulse">
                          Vote Now
                       </span>
                    ) : null}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Secret ID Display */}
      <div className="card p-5 bg-gradient-to-r from-slate-800 to-slate-900 border-none relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-24 h-24 text-white" />
         </div>
         <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
               <Lock className="w-6 h-6 text-teal-400" />
            </div>
            <div className="flex-1">
               <h3 className="font-semibold text-lg">Your Secret Voter IDs</h3>
               <p className="text-slate-300 text-sm max-w-2xl mb-3">Keep these IDs private. You will need the full ID when casting your vote.</p>
               
               <div className="flex flex-wrap gap-3">
                  {Object.entries(secretIds).length > 0 ? (
                     Object.entries(secretIds).map(([pollId, secret]) => (
                        <div key={pollId} className="bg-slate-950/50 rounded-lg px-4 py-2 border border-slate-700 font-mono tracking-widest font-bold text-teal-400">
                           {secret}
                        </div>
                     ))
                  ) : (
                     <p className="text-xs text-slate-400 italic">Register for an election to receive your Secret ID.</p>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

const mockRegistered = [
    {
      id: '1', title: 'Student Council Election 2025', category: 'Student Council',
      status: 'active', start_at: new Date(Date.now() - 86400000).toISOString(),
      end_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      max_voters: 500, vote_count: 312, voter_status: 'registered'
    },
    {
      id: '3', title: 'Corporate Leadership Vote', category: 'Corporate',
      status: 'completed', start_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      end_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      max_voters: 1000, vote_count: 873, voter_status: 'voted'
    },
]

export default VoterDashboard
