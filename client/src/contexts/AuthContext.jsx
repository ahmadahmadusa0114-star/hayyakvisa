import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('hayyak_user');
    const token = localStorage.getItem('hayyak_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('hayyak_user', JSON.stringify(userData));
    localStorage.setItem('hayyak_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hayyak_user');
    localStorage.removeItem('hayyak_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshUser = async () => {
    if (user?.role === 'COMPANY') {
      try {
        const { data } = await axios.get('/api/wallet/balance');
        const updated = { ...user, wallet_balance: data.wallet_balance, markup_price: data.markup_price };
        setUser(updated);
        localStorage.setItem('hayyak_user', JSON.stringify(updated));
      } catch {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
