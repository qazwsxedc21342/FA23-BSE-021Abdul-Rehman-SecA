import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Vote, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Invalid email address'); return }
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="auth-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-700 to-teal-600 shadow-primary mb-4">
              <Vote className="w-8 h-8 text-white" />
            </div>
            {!sent ? (
              <>
                <h1 className="font-display text-2xl font-bold text-slate-800">Forgot Password?</h1>
                <p className="text-slate-500 text-sm mt-1">Enter your email to receive a reset link</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-green-500" />
                </div>
                <h1 className="font-display text-2xl font-bold text-slate-800">Email Sent!</h1>
                <p className="text-slate-500 text-sm mt-1">Check your inbox for the password reset link</p>
              </>
            )}
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fp-email" className="form-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="fp-email" type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    className={`input-field pl-10 ${error ? 'border-red-400' : ''}`} />
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>Sending...</>
                ) : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-slate-600 text-sm">
                We sent a reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
              </p>
              <button onClick={() => setSent(false)} className="btn-outline w-full py-2.5">
                Resend Email
              </button>
            </div>
          )}

          <Link to="/login" className="flex items-center justify-center gap-2 mt-5 text-sm text-slate-500 hover:text-primary-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPasswordPage
