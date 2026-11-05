import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Kiểm tra token hết hạn
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('access_token');
          setUser(null);
        } else {
          setUser({
            id: decoded.id || decoded.sub,
            ho_ten: decoded.ho_ten,
            email: decoded.email,
            vai_tro: decoded.vai_tro,
            trung_tam_id: decoded.trung_tam_id,
          });
        }
      } catch {
        localStorage.removeItem('access_token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login({ email, password });
    const token = response.data?.token || response.token;
    localStorage.setItem('access_token', token);
    const decoded = jwtDecode(token);
    setUser({
      id: decoded.id || decoded.sub,
      ho_ten: decoded.ho_ten,
      email: decoded.email,
      vai_tro: decoded.vai_tro,
      trung_tam_id: decoded.trung_tam_id,
    });
    return decoded;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
