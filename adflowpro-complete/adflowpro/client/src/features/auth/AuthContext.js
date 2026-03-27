'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = Cookies.get('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { user: u, token } = data.data;
    Cookies.set('token', token, { expires: 7 });
    Cookies.set('user',  JSON.stringify(u), { expires: 7 });
    setUser(u);
    return u;
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    setUser(null);
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    const { user: u, token } = data.data;
    Cookies.set('token', token, { expires: 7 });
    Cookies.set('user',  JSON.stringify(u), { expires: 7 });
    setUser(u);
    return u;
  };

  const isRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, isRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
