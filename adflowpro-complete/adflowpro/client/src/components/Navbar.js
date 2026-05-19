'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../features/auth/AuthContext';
import { useState } from 'react';

const navLinks = [
  { href: '/',         label: 'Home',     public: true },
  { href: '/explore',  label: 'Explore',  public: true },
  { href: '/packages', label: 'Packages', public: true },
];

export default function Navbar() {
  const { user, logout, isRole } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const ROLE_DASH = {
    client:     '/client/dashboard',
    moderator:  '/admin',
    admin:      '/admin',
    superadmin: '/admin',
  };

  return (
    <nav style={{
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 24px',
      display: 'flex', alignItems: 'center', height: 56, gap: 8,
    }}>
      {/* Logo */}
      <Link href="/" style={{ fontWeight: 900, fontSize: 20, color: '#e94560', marginRight: 12, letterSpacing: -0.5 }}>
        AdFlow<span style={{ color: '#f5a623' }}>Pro</span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {navLinks.map(l => (
          <Link key={l.href} href={l.href} style={{
            padding: '5px 12px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            color: router.pathname === l.href ? '#e94560' : '#94a3b8',
            background: router.pathname === l.href ? '#e9456015' : 'transparent',
            transition: 'all 0.15s',
          }}>{l.label}</Link>
        ))}
        {user && (
          <Link href={ROLE_DASH[user.role] || '/'} style={{
            padding: '5px 12px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            color: router.pathname.startsWith('/client') || router.pathname.startsWith('/admin') || router.pathname.startsWith('/moderator') ? '#e94560' : '#94a3b8',
            background: 'transparent', transition: 'all 0.15s',
          }}>Dashboard</Link>
        )}
        {isRole('admin','superadmin') && (
          <Link href="/analytics" style={{ padding: '5px 12px', borderRadius: 7, fontSize: 13, fontWeight: 500, color: router.pathname === '/analytics' ? '#e94560' : '#94a3b8' }}>
            Analytics
          </Link>
        )}
      </div>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {user ? (
          <>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              <span style={{ color: '#22c55e', fontSize: 10 }}>●</span>{' '}
              {user.name} · <span style={{ color: '#f5a623', textTransform: 'capitalize' }}>{user.role}</span>
            </span>
            <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-secondary" style={{ padding: '5px 14px', fontSize: 13, borderRadius: 7, display: 'inline-block' }}>
              Sign In
            </Link>
            <Link href="/register" className="btn-primary" style={{ padding: '5px 14px', fontSize: 13, borderRadius: 7, display: 'inline-block' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
