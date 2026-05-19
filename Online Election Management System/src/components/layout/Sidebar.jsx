import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import {
  Vote, LayoutDashboard, Users, CheckSquare, FileText,
  BarChart3, Bell, Settings, LogOut, ChevronLeft, Shield,
  ListChecks, UserCheck, Activity
} from 'lucide-react'

const adminNav = [
  { label: 'Dashboard',       to: '/admin',              icon: LayoutDashboard },
  { label: 'Approvals',       to: '/admin/approvals',    icon: UserCheck },
  { label: 'Elections',       to: '/admin/elections',    icon: Vote },
  { label: 'Users',           to: '/admin/users',        icon: Users },
  { label: 'Audit Logs',      to: '/admin/audit',        icon: Activity },
  { label: 'Notifications',   to: '/admin/notifications',icon: Bell },
]

const creatorNav = [
  { label: 'Dashboard',       to: '/creator',            icon: LayoutDashboard },
  { label: 'My Elections',    to: '/creator/elections',  icon: Vote },
  { label: 'Voter Lists',     to: '/creator/voters',     icon: ListChecks },
  { label: 'Notifications',   to: '/creator/notifications', icon: Bell },
  { label: 'Results',         to: '/creator/results',    icon: BarChart3 },
]

const voterNav = [
  { label: 'Dashboard',       to: '/voter',              icon: LayoutDashboard },
  { label: 'My Elections',    to: '/voter/elections',    icon: Vote },
  { label: 'My Votes',        to: '/voter/votes',        icon: CheckSquare },
  { label: 'Results',         to: '/voter/results',      icon: BarChart3 },
  { label: 'Notifications',   to: '/voter/notifications',icon: Bell },
]

const navByRole = { admin: adminNav, election_creator: creatorNav, voter: voterNav }

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const links = navByRole[profile?.role] || voterNav

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="bg-sidebar h-screen flex flex-col fixed left-0 top-0 z-30 overflow-hidden shadow-2xl"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Vote className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display font-bold text-white text-lg whitespace-nowrap"
          >
            VoteSecure
          </motion.span>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="ml-auto p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* User info */}
      <div className="px-3 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{profile?.name || 'User'}</p>
              <p className="text-blue-200 text-xs capitalize truncate">
                {profile?.role?.replace('_', ' ') || 'voter'}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length === 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
               ${isActive
                 ? 'bg-white/20 text-white shadow-sm'
                 : 'text-blue-200 hover:bg-white/10 hover:text-white'}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                {label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <NavLink
          to={`/${profile?.role === 'admin' ? 'admin' : profile?.role === 'election_creator' ? 'creator' : 'voter'}/profile`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
             ${isActive ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`
          }
          title={collapsed ? 'Profile' : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Profile</motion.span>}
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all w-full"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Sign Out</motion.span>}
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar
