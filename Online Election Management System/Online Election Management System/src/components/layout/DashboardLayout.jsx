import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 256 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex-1 min-h-screen flex flex-col"
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 h-16 gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{profile?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 capitalize leading-tight">{profile?.role?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}

export default DashboardLayout
