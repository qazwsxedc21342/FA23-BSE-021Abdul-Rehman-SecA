import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../features/auth/AuthContext';
import toast from 'react-hot-toast';

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
      router.push('/client/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 36, width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#e94560', marginBottom: 4 }}>
            AdFlow<span style={{ color: '#f5a623' }}>Pro</span>
          </div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Create your free account</div>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            ['name',     'Full Name',        'text',     'Ali Hassan'],
            ['email',    'Email Address',    'email',    'ali@example.com'],
            ['password', 'Password',         'password', 'Min 6 characters'],
            ['confirm',  'Confirm Password', 'password', 'Repeat password'],
          ].map(([key, label, type, placeholder]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label className="label">{label}</label>
              <input className="input" type={type} required placeholder={placeholder}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px 0', fontSize: 15, borderRadius: 10, marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#e94560', fontWeight: 600 }}>Sign in</Link>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: '#475569', textAlign: 'center', lineHeight: 1.6 }}>
          By registering you agree to our Terms of Service and Privacy Policy.
          All listings are subject to moderation before going live.
        </div>
      </div>
    </div>
  );
}
