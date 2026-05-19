import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { fetchVoteCountsByPollIds, getRuntimeStatus, runQuery } from '../../lib/electionData'
import { useAuth } from '../../contexts/AuthContext'
import StatCard from '../../components/ui/StatCard'
import { CardSkeleton } from '../../components/ui/Skeleton'
import ElectionCard from '../../components/elections/ElectionCard'
import { Vote, Users, Plus, ListChecks, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const CreatorDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        await Promise.all([fetchStats(), fetchElections()])
      } catch (error) {
        console.error('Data load error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [user])

  const fetchStats = async () => {
    try {
      const [
        { count: totalElections },
        { count: activeElections },
        { count: draftElections },
      ] = await Promise.all([
        runQuery(supabase.from('elections').select('*', { count: 'exact', head: true }).eq('creator_id', user.id), 'Loading total elections'),
        runQuery(supabase.from('elections').select('*', { count: 'exact', head: true }).eq('creator_id', user.id).eq('status', 'active'), 'Loading active elections'),
        runQuery(supabase.from('elections').select('*', { count: 'exact', head: true }).eq('creator_id', user.id).eq('status', 'draft'), 'Loading draft elections'),
      ])
      
      // Get total voters across all elections
      const { data: electionIds } = await runQuery(
        supabase.from('elections').select('id').eq('creator_id', user.id),
        'Loading creator election IDs'
      )
      let totalVoters = 0
      if (electionIds?.length > 0) {
        const ids = electionIds.map(e => e.id)
        const { data: polls } = await runQuery(
          supabase.from('polls').select('id').in('election_id', ids),
          'Loading creator polls'
        )
        if (polls?.length > 0) {
          const pollIds = polls.map(p => p.id)
          const { count } = await runQuery(
            supabase.from('voter_registrations').select('*', { count: 'exact', head: true }).in('poll_id', pollIds),
            'Loading voter count'
          )
          totalVoters = count || 0
        }
      }

      setStats({
        totalElections: totalElections || 0,
        activeElections: activeElections || 0,
        draftElections: draftElections || 0,
        totalVoters,
      })
    } catch (error) {
      console.error('Stats fetch error:', error)
      setStats({ totalElections: 0, activeElections: 0, draftElections: 0, totalVoters: 0 })
    }
  }

  const fetchElections = async () => {
    try {
      const { data } = await runQuery(
        supabase
          .from('elections')
          .select('*, polls(id)')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        'Loading creator elections'
      )

      const pollIds = (data || []).flatMap(el => (el.polls || []).map(p => p.id))
      let voteCounts = new Map()
      try {
        voteCounts = await fetchVoteCountsByPollIds(pollIds)
      } catch (error) {
        console.warn('Creator vote counts could not be loaded:', error)
      }
        
      const enriched = (data || []).map(el => {
        const status = getRuntimeStatus(el)
        const voteCount = (el.polls || []).reduce((sum, poll) => sum + (voteCounts.get(poll.id) || 0), 0)
        return { ...el, status, vote_count: voteCount }
      })
      setElections(enriched)
    } catch (error) {
      console.error('Elections fetch error:', error)
      setElections([])
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Creator Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your elections and monitor results</p>
        </div>
        <Link to="/creator/elections/new" className="btn-primary flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Create Election
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Elections"   value={loading ? '—' : stats?.totalElections}  icon={Vote}       color="blue"   loading={loading} />
        <StatCard title="Active Elections"  value={loading ? '—' : stats?.activeElections} icon={PlayCircle} color="green"  loading={loading} />
        <StatCard title="Drafts"            value={loading ? '—' : stats?.draftElections}  icon={ListChecks} color="yellow" loading={loading} />
        <StatCard title="Total Voters"      value={loading ? '—' : stats?.totalVoters}     icon={Users}      color="teal"   loading={loading} />
      </div>

      {/* Recent Elections */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold text-slate-800">Recent Elections</h2>
          <Link to="/creator/elections" className="text-sm font-medium text-primary-600 hover:text-primary-800">View All →</Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : elections.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Vote className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="font-display font-semibold text-slate-800 mb-2">No elections yet</h3>
             <p className="text-slate-500 text-sm mb-6 max-w-md">You haven't created any elections. Start by creating your first election.</p>
             <Link to="/creator/elections/new" className="btn-primary">Create Election</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((el, i) => (
              <ElectionCard key={el.id} election={el} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreatorDashboard
