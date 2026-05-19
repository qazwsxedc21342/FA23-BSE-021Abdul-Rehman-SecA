import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getErrorMessage, runQuery } from '../../lib/electionData'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Users, Search, Shield, ShieldCheck, ShieldAlert, Trash2, RefreshCw } from 'lucide-react'

const roleColors = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  election_creator: 'bg-blue-100 text-blue-700 border-blue-200',
  voter: 'bg-slate-100 text-slate-600 border-slate-200',
  super_admin: 'bg-red-100 text-red-700 border-red-200',
}

const roleIcons = {
  admin: ShieldCheck,
  election_creator: Shield,
  voter: Users,
  super_admin: ShieldAlert,
}

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    let result = users
    if (search) result = result.filter(u =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )
    if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter)
    setFiltered(result)
  }, [search, roleFilter, users])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await runQuery(
        supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false }),
        'Loading users'
      )
      setUsers(data || [])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load users'))
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId)
    try {
      await runQuery(
        supabase.from('users').update({ role: newRole }).eq('id', userId),
        'Updating role'
      )
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success('Role updated successfully')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update role'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleVerify = async (userId, current) => {
    setUpdatingId(userId)
    try {
      await runQuery(
        supabase.from('users').update({ verified: !current }).eq('id', userId),
        'Updating verification'
      )
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: !current } : u))
      toast.success(`User ${!current ? 'verified' : 'unverified'} successfully`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update verification'))
    } finally {
      setUpdatingId(null)
    }
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    creators: users.filter(u => u.role === 'election_creator').length,
    voters: users.filter(u => u.role === 'voter').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" /> User Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage all registered users and their roles</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Admins', value: stats.admins, color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { label: 'Creators', value: stats.creators, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Voters', value: stats.voters, color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`card p-4 border ${s.color}`}>
            <p className="text-2xl font-bold">{loading ? '—' : s.value}</p>
            <p className="text-sm font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="election_creator">Creators</option>
          <option value="voter">Voters</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Joined</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="5" className="p-4">
                    <div className="h-5 bg-slate-100 rounded w-3/4" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-slate-500 italic">No users found.</td>
              </tr>
            ) : filtered.map((user, i) => {
              const RoleIcon = roleIcons[user.role] || Users
              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-teal-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${roleColors[user.role] || roleColors.voter}`}
                    >
                      <option value="voter">Voter</option>
                      <option value="election_creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleVerify(user.id, user.verified)}
                      disabled={updatingId === user.id}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        user.verified
                          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
                      }`}
                    >
                      {user.verified ? '✓ Verified' : '⚠ Unverified'}
                    </button>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs text-slate-400">
                      {updatingId === user.id ? 'Saving...' : ''}
                    </span>
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

export default AdminUsers
