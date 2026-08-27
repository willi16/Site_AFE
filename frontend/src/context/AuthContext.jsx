import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/members/me/');
      setMember(data);
      setUser(data.user);
      return data;
    } catch {
      setUser(null);
      setMember(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const getDashboardPath = (memberData) => {
    if (!memberData) return '/espace-membre';
    if (memberData.role === 'treasurer') return '/espace-tresorier';
    if (memberData.role === 'secretary') return '/espace-secretaire';
    if (memberData.role === 'bureau' || memberData.role === 'admin') return '/espace-bureau';
    return '/espace-membre';
  };

  const login = async (username, password) => {
    const { data } = await api.post('/auth/token/', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const memberData = await fetchProfile();
    return { ...data, dashboardPath: getDashboardPath(memberData) };
  };

  const register = async (userData) => {
    const { data } = await api.post('/members/register/', userData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setMember(null);
  };

  const isBureau = member?.role === 'bureau' || member?.role === 'admin';
  const isSecretary = member?.role === 'secretary';
  const isTreasurer = member?.role === 'treasurer';
  const isAdmin = member?.role === 'admin';
  const isStaff = isBureau || isSecretary || isTreasurer;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, member, loading, login, register, logout, isBureau, isSecretary, isTreasurer, isAdmin, isStaff, isAuthenticated, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
