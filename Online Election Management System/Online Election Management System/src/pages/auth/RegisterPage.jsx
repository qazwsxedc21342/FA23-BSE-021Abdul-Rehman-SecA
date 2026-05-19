import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { getErrorMessage } from '../../lib/electionData'
import { Eye, EyeOff, Vote, Lock, Mail, User, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const roles = [
  { value: 'voter',            label: 'Voter',            desc: 'Participate in elections' },
  { value: 'election_creator', label: 'Election Creator', desc: 'Create & manage elections' },
]

const RegisterPage = () => {
  const { signUp } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'voter' })
  const [errors, setErrors] = useState({})
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedRole, setSubmittedRole] = useState('voter')

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name = 'Full name is required'
    if (!form.email)         e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'
    if (!form.phone)         e.phone = 'Phone number is required'
    else if (!/^\+?[\d\s\-()]{10,}$/.test(form.phone)) e.phone = 'Invalid phone number'
    if (!form.password)      e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(form.password)) e.password = 'Password must contain uppercase letter and number'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const pwdStrength = (pwd) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }
  const strength = pwdStrength(form.password)
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await signUp({ email: form.email, password: form.password, name: form.name, phone: form.phone, role: form.role })
      setSubmittedRole(form.role)
      setSuccess(true)
    } catch (err) {
      const message = getErrorMessage(err, 'Registration failed')
      toast.error(message)
      setErrors({ form: message })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '', form: '' }))
  }

  if (success) {
    const isCreatorRequest = submittedRole === 'election_creator'
    return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="auth-card p-10 w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">
          Check Your Email!
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          We've sent a verification link to <strong>{form.email}</strong>. Please verify your email to continue.
        </p>
        <Link to="/login" className="btn-primary inline-flex">Back to Login</Link>
      </motion.div>
    </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4 py-12 relative">
      <div className="absolute top-20 right-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-lg relative"
      >
        <div className="auth-card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-700 to-teal-600 shadow-primary mb-4">
              <Vote className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-800">Create Account</h1>
            <p className="text-slate-500 text-sm mt-1">Join VoteSecure today</p>
          </div>

          {errors.form && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errors.form}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Role selector */}
            <div>
              <label className="form-label">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setForm(p => ({ ...p, role: r.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.role === r.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-slate-200 hover:border-primary-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${form.role === r.value ? 'text-primary-700' : 'text-slate-700'}`}>{r.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="name" name="name" type="text" value={form.name} onChange={handleChange}
                  placeholder="John Doe"
                  className={`input-field pl-10 ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className={`input-field pl-10 ${errors.phone ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-password" name="password" type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={handleChange} placeholder="Min. 8 characters"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${strength >= i ? strengthColors[strength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strength >= 3 ? 'text-green-600' : strength >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="confirmPassword" name="confirmPassword" type="password"
                  value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password"
                  className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>Creating Account...</>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-semibold hover:text-primary-900">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterPage
