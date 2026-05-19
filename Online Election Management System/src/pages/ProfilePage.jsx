import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Save, RefreshCw, Shield } from 'lucide-react'

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', email: profile.email || '', phone: profile.phone || '' })
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: form.name, phone: form.phone })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile?.()
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.new !== pwForm.confirm) return toast.error('Passwords do not match')
    if (pwForm.new.length < 6) return toast.error('Password must be at least 6 characters')
    setChangingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.new })
      if (error) throw error
      toast.success('Password changed successfully!')
      setPwForm({ current: '', new: '', confirm: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to change password')
    } finally {
      setChangingPw(false)
    }
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    election_creator: 'bg-blue-100 text-blue-700 border-blue-200',
    voter: 'bg-green-100 text-green-700 border-green-200',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
          <User className="w-6 h-6 text-primary-600" /> My Profile
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal information and account settings</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-teal-400 flex items-center justify-center text-white font-bold text-3xl shrink-0">
          {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h2 className="font-display font-bold text-xl text-slate-800">{profile?.name || 'User'}</h2>
          <p className="text-slate-500 text-sm">{profile?.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${roleColors[profile?.role] || roleColors.voter}`}>
              <Shield className="w-3 h-3 inline mr-1" />
              {profile?.role?.replace('_', ' ')}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${profile?.verified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
              {profile?.verified ? '✓ Verified' : '⚠ Not Verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {['profile', 'security'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'profile' ? 'Personal Info' : 'Security'}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSave} className="card p-6 space-y-5">
            <h3 className="font-semibold text-slate-700">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    className="input-field pl-10 bg-slate-50 cursor-not-allowed"
                    readOnly
                    title="Email cannot be changed"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="input-field pl-10"
                    placeholder="+92 300 0000000"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handlePasswordChange} className="card p-6 space-y-5">
            <h3 className="font-semibold text-slate-700">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={pwForm.new}
                    onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))}
                    className="input-field pl-10"
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    className="input-field pl-10"
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={changingPw} className="btn-primary flex items-center gap-2">
                {changingPw ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {changingPw ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  )
}

export default ProfilePage
