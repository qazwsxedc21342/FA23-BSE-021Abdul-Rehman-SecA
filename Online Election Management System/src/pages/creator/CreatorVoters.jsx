import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getErrorMessage, runQuery } from '../../lib/electionData'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { CardSkeleton } from '../../components/ui/Skeleton'
import ElectionCard from '../../components/elections/ElectionCard'
import { Users, Search, UserCheck, UserX, RefreshCw } from 'lucide-react'

const CreatorVoters = () => {
  const { user } = useAuth()
  const [elections, setElections] = useState([])
  const [selected, setSelected] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(false)
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
          .select('id, title, status')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        'Loading creator elections'
      )
      setElections(data || [])
      if (data?.length > 0) fetchRegistrations(data[0].id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load elections'))
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async (electionId) => {
    setSelected(electionId)
    setLoadingRegs(true)
    try {
      const { data: polls } = await runQuery(
        supabase
          .from('polls')
          .select('id')
          .eq('election_id', electionId),
        'Loading election ballots'
      )

      if (!polls?.length) { setRegistrations([]); return }

      const pollIds = polls.map(p => p.id)
      const { data } = await runQuery(
        supabase
          .from('voter_registrations')
          .select('*, users:user_id(name, email)')
          .in('poll_id', pollIds)
          .order('registered_at', { ascending: false }),
        'Loading voter list'
      )
      setRegistrations(data || [])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load voter list'))
    } finally {
      setLoadingRegs(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    let reason = ''
    if (newStatus === 'rejected') {
       reason = window.prompt("Please provide a mandatory reason for this override:")
       if (!reason) {
          toast.error("A reason is mandatory to reject a voter.")
          return
       }
    }
    
    try {
      await runQuery(
        supabase
          .from('voter_registrations')
          .update({ status: newStatus })
          .eq('id', id),
        'Updating voter status'
      )
      
      // Optionally log to audit_logs
      if (reason) {
         await runQuery(
           supabase.from('audit_logs').insert({
              action: 'voter_override',
              actor_id: user.id,
              target_id: id,
              details_json: { status: newStatus, reason: reason }
           }),
           'Creating audit log'
         )
      }
      
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
      toast.success('Voter status updated')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update status'))
    }
  }

  const statusColors = {
    registered: 'bg-blue-100 text-blue-700',
    waitlisted: 'bg-orange-100 text-orange-700',
    voted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const filtered = registrations.filter(r => {
    const matchSearch = !search ||
      r.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.users?.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" /> Voter Lists
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage voter registrations for your elections</p>
      </div>

      {loading ? (
        <div className="card p-6 animate-pulse"><div className="h-5 bg-slate-100 rounded w-1/2" /></div>
      ) : elections.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Create an election first to manage voters.</p>
          <Link to="/creator/elections/new" className="btn-primary mt-4 inline-block">Create Election</Link>
        </div>
      ) : (
        <>
          {/* Election tabs */}
          <div className="flex flex-wrap gap-2">
            {elections.map(el => (
              <button
                key={el.id}
                onClick={() => fetchRegistrations(el.id)}
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

          {/* Stats & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
              {['registered', 'voted', 'waitlisted', 'rejected'].map(s => (
                <div key={s} className="card p-4">
                  <p className="text-xl font-bold text-slate-800">{registrations.filter(r => r.status === s).length}</p>
                  <p className={`text-xs font-semibold mt-1 capitalize px-2 py-0.5 inline-block rounded-full ${statusColors[s]}`}>{s}</p>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                if (registrations.length === 0) return toast.error('No voters to export')
                const csv = [
                  ['Name', 'Email', 'Status', 'Registered At'],
                  ...registrations.map(reg => [
                    `"${reg.users?.name || ''}"`,
                    `"${reg.users?.email || ''}"`,
                    reg.status,
                    reg.registered_at ? new Date(reg.registered_at).toLocaleString() : ''
                  ])
                ].map(row => row.join(',')).join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `voter_list_${selected}.csv`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Voter list exported successfully')
              }}
              className="btn-primary py-3 px-6 whitespace-nowrap"
            >
              Generate Final Voter List (CSV)
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search voters..."
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
              <option value="all">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="voted">Voted</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loadingRegs ? (
            <div className="card p-8 text-center"><RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" /></div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                    <th className="p-4 font-semibold">Voter</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Registered</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-slate-500 italic">No voters found.</td>
                    </tr>
                  ) : filtered.map((reg, i) => (
                    <motion.tr
                      key={reg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {reg.users?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{reg.users?.name || '—'}</p>
                            <p className="text-xs text-slate-400">{reg.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[reg.status] || 'bg-slate-100 text-slate-600'}`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 text-right">
                        {reg.status === 'registered' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleStatusChange(reg.id, 'rejected')}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CreatorVoters
