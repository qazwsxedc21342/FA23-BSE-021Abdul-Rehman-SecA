import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

const typeIcons = {
  info: { icon: Info, color: 'text-blue-500 bg-blue-50' },
  success: { icon: CheckCircle, color: 'text-green-500 bg-green-50' },
  warning: { icon: AlertTriangle, color: 'text-orange-500 bg-orange-50' },
  error: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
}

const AdminNotifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setNotifications(data || [])
    } catch {
      setNotifications(mockNotifications)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await supabase.from('notifications').update({ status: 'read' }).eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n))
    } catch {
      toast.error('Failed to update notification')
    }
  }

  const markAllRead = async () => {
    try {
      await supabase.from('notifications').update({ status: 'read' }).eq('user_id', user.id).eq('status', 'unread')
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })))
      toast.success('All notifications marked as read')
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })))
      toast.success('All notifications marked as read')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await supabase.from('notifications').delete().eq('id', id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-600" /> Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Stay updated with platform activity</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 border border-primary-200 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No notifications yet</p>
            <p className="text-slate-400 text-sm mt-1">You're all caught up!</p>
          </div>
        ) : notifications.map((notif, i) => {
          const typeConfig = typeIcons[notif.type] || typeIcons.info
          const Icon = typeConfig.icon
          return (
            <motion.div
              key={notif.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`card p-5 flex items-start gap-4 transition-all ${notif.status === 'unread' ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeConfig.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notif.status === 'unread' ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {notif.created_at ? format(new Date(notif.created_at), 'MMM d, yyyy h:mm a') : 'Just now'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {notif.status === 'unread' && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

const mockNotifications = [
  { id: 1, type: 'info', message: 'New creator request from John Doe awaiting approval', status: 'unread', created_at: new Date().toISOString() },
  { id: 2, type: 'success', message: 'Election "Student Council 2025" has started successfully', status: 'unread', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, type: 'warning', message: '5 elections are ending in the next 24 hours', status: 'read', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, type: 'info', message: '12 new users registered today', status: 'read', created_at: new Date(Date.now() - 86400000).toISOString() },
]

export default AdminNotifications
