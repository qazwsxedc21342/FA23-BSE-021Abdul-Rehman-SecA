import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../features/auth/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { register } = useAuth();
  const router       = useRouter();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6)       { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to AdFlow Pro.');
      
      const { pkg } = router.query;
      const redirect = pkg ? `/client/dashboard?tab=payment&pkg=${pkg}` : '/client/dashboard';
      router.push(redirect);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
        style={{ padding: 48, width: '100%', maxWidth: 460, borderRadius: 28 }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, color: '#e94560', marginBottom: 6, letterSpacing: -1 }}>
            AdFlow<span style={{ color: '#f5a623' }}>Pro</span>
          </div>
          <div style={{ fontSize: 15, color: '#94a3b8', fontWeight: 500 }}>Create your free account today</div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          {[
            ['name',     'Full Name',        'text',     'Ali Hassan'],
            ['email',    'Email Address',    'email',    'ali@example.com'],
            ['password', 'Password',         'password', 'Min 6 characters'],
            ['confirm',  'Confirm Password', 'password', 'Repeat password'],
          ].map(([key, label, type, placeholder], idx) => (
            <motion.div 
              key={key} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.3 + (idx * 0.1) }}
              style={{ marginBottom: 14 }}
            >
              <label className="label">{label}</label>
              <input className="input" type={type} required placeholder={placeholder}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)' }} />
            </motion.div>
          ))}
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: '#ff5a77' }}
            whileTap={{ scale: 0.98 }}
            type="submit" className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 16, borderRadius: 12, fontWeight: 700, marginTop: 12 }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Get Started Now →'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#e94560', fontWeight: 700, textDecoration: 'none' }}>Sign in here</Link>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: 24, fontSize: 11, color: '#475569', textAlign: 'center', lineHeight: 1.6 }}
        >
          By registering you agree to our Terms of Service and Privacy Policy.<br/>
          All listings are subject to moderation before going live.
        </motion.div>
      </motion.div>
    </div>
  );
}
