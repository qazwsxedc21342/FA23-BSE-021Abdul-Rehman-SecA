import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { runQuery } from '../../lib/electionData'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Vote, ArrowLeft, Users, Trophy } from 'lucide-react'

const COLORS = ['#3b82f6', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']

const ResultsPage = () => {
  const { id } = useParams()
  const [election, setElection] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
    
    // Real-time polling every 10 seconds for live results
    const interval = setInterval(() => {
      fetchResults()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [id])

  const fetchResults = async () => {
    try {
      // Fetch Election
      const { data: elData } = await runQuery(
        supabase
          .from('elections')
          .select('*')
          .eq('id', id)
          .single(),
        'Loading election results'
      )
      setElection(elData)

      // Fetch Polls, Candidates, and count votes
      const { data: pollData } = await runQuery(
        supabase
          .from('polls')
          .select(`
            id, title,
            candidates (
              id, name, designation,
              votes (count)
            )
          `)
          .eq('election_id', id),
        'Loading vote results'
      )

      // Transform data for charts
      const transformedResults = (pollData || []).map(poll => {
         const candidatesData = poll.candidates.map(c => ({
            name: c.name,
            votes: c.votes?.[0]?.count || 0,
            designation: c.designation
         })).sort((a, b) => b.votes - a.votes)
         
         const totalVotes = candidatesData.reduce((sum, c) => sum + c.votes, 0)
         const winner = candidatesData.length > 0 && candidatesData[0].votes > 0 ? candidatesData[0] : null
         
         return { ...poll, candidatesData, totalVotes, winner }
      })
      
      setResults(transformedResults)
    } catch (error) {
      console.error('Failed to load results', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
     <div className="min-h-screen bg-slate-50 flex flex-col">
       <Navbar />
       <main className="flex-1 max-w-7xl mx-auto px-4 w-full pt-32 pb-12"><CardSkeleton className="h-64" /></main>
     </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="bg-primary-900 pt-28 pb-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
           <Link to={`/elections/${id}`} className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Election Details
           </Link>
           <h1 className="font-display text-4xl font-bold mb-4">Live Results</h1>
           <p className="text-blue-200 text-lg">{election?.title}</p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
        {results.length === 0 ? (
           <div className="text-center py-12">
              <p className="text-slate-500">No results data available yet.</p>
           </div>
        ) : (
           results.map((poll, idx) => (
             <div key={poll.id} className="card p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
                   <div>
                      <h2 className="font-display text-2xl font-bold text-slate-800">{poll.title}</h2>
                      <p className="text-slate-500 mt-1 flex items-center gap-2">
                         <Vote className="w-4 h-4" /> Total Votes Cast: <span className="font-semibold text-slate-700">{poll.totalVotes}</span>
                      </p>
                   </div>
                   {poll.winner && (
                      <div className="flex items-center gap-3 bg-yellow-50 px-4 py-3 rounded-xl border border-yellow-200">
                         <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                         </div>
                         <div>
                            <p className="text-xs text-yellow-600 uppercase font-bold tracking-wider">{election?.status === 'completed' ? 'Final Winner' : 'Current Leader'}</p>
                            <p className="font-bold text-slate-800">{poll.winner.name} ({poll.winner.votes} votes)</p>
                         </div>
                      </div>
                   )}
                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                   {/* Bar Chart */}
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={poll.candidatesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#475569' }} width={120} />
                           <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                           <Bar dataKey="votes" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32}>
                             {poll.candidatesData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                   
                   {/* Table / List */}
                   <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                         <Users className="w-5 h-5 text-slate-400" /> Breakdown
                      </h3>
                      <div className="space-y-4">
                         {poll.candidatesData.map((c, i) => {
                            const percentage = poll.totalVotes > 0 ? ((c.votes / poll.totalVotes) * 100).toFixed(1) : 0;
                            return (
                               <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                     <div>
                                        <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="font-bold text-slate-800">{c.votes}</p>
                                     <p className="text-xs text-slate-500">{percentage}%</p>
                                  </div>
                               </div>
                            )
                         })}
                      </div>
                   </div>
                </div>
             </div>
           ))
        )}
      </main>

      <Footer />
    </div>
  )
}

export default ResultsPage
