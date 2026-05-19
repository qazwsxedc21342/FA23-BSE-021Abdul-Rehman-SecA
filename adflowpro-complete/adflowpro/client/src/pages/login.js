import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../features/auth/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);



  const ROLE_REDIRECT = { client: '/client/dashboard', moderator: '/admin', admin: '/admin', superadmin: '/admin' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);

      const { pkg } = router.query;
      const redirect = (user.role === 'client' && pkg)
        ? `/client/dashboard?tab=payment&pkg=${pkg}`
        : (ROLE_REDIRECT[user.role] || '/');

      router.push(redirect);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, perspective: 1000 }}>
      <motion.div 
        className="glass"
        initial={{ opacity: 0, y: 40, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ padding: 48, width: '100%', maxWidth: 440, borderRadius: 28 }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, color: '#e94560', marginBottom: 6, letterSpacing: -1 }}>
            AdFlow<span style={{ color: '#f5a623' }}>Pro</span>
          </div>
          <div style={{ fontSize: 15, color: '#94a3b8', fontWeight: 500 }}>Welcome back, please sign in</div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 18 }}>
            <label className="label">Email Address</label>
            <input className="input" type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" style={{ background: 'rgba(0,0,0,0.2)' }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ marginBottom: 28 }}>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={{ background: 'rgba(0,0,0,0.2)' }} />
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: '#ff5a77' }}
            whileTap={{ scale: 0.98 }}
            type="submit" className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 16, borderRadius: 12, fontWeight: 700 }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In →'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748b' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: '#e94560', fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
        </div>
      </motion.div>
    </div>
  );
}
