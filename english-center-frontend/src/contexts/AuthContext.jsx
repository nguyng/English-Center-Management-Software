import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import authApi from '../api/authApi';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

function safeDecode(token) {
  if (!token) return null;
  // Thử giải mã chuẩn JWT
  try {
    const decoded = jwtDecode(token);
    if (decoded && (decoded.vai_tro || decoded.email)) {
      return decoded;
    }
  } catch {
    // Không phải JWT chuẩn, thử parse mock token
  }

  try {
    let base64Part = token;
    if (token.includes('.')) {
      base64Part = token.split('.')[1];
    }
    const jsonStr = decodeURIComponent(escape(atob(base64Part)));
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function safeEncode(obj) {
  const jsonStr = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(jsonStr)));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded = safeDecode(token);
      if (decoded) {
        // Kiểm tra token hết hạn (nếu có exp)
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('access_token');
          setUser(null);
        } else {
          setUser({
            id: decoded.id || decoded.sub || 1,
            ho_ten: decoded.ho_ten || 'Người dùng',
            email: decoded.email,
            vai_tro: decoded.vai_tro || ROLES.ADMIN,
            trung_tam_id: decoded.trung_tam_id || 1,
          });
        }
      } else {
        localStorage.removeItem('access_token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      // 1. Thử gọi API Backend thật
      const response = await authApi.login({ email, password });
      const token = response.data?.token || response.token;
      localStorage.setItem('access_token', token);
      const decoded = safeDecode(token);
      const userData = {
        id: decoded.id || decoded.sub || 1,
        ho_ten: decoded.ho_ten,
        email: decoded.email,
        vai_tro: decoded.vai_tro,
        trung_tam_id: decoded.trung_tam_id,
      };
      setUser(userData);
      return userData;
    } catch (apiError) {
      console.warn('Backend API chưa sẵn sàng, kích hoạt Mock Login tự động:', apiError.message);

      // 2. Tự động xác định Role theo email để demo
      let role = ROLES.ADMIN;
      let hoTen = 'Quản Trị Viên';

      const lowerEmail = (email || '').toLowerCase();
      if (lowerEmail.includes('teacher') || lowerEmail.includes('gv') || lowerEmail.includes('giaovien')) {
        role = ROLES.GIAO_VIEN;
        hoTen = 'Thầy Giáo Nguyễn Văn A';
      } else if (lowerEmail.includes('super') || lowerEmail.includes('saas')) {
        role = ROLES.SUPER_ADMIN;
        hoTen = 'Super Admin';
      }

      const userData = {
        id: 1,
        ho_ten: hoTen,
        email: email,
        vai_tro: role,
        trung_tam_id: 1,
        exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      };

      // Tạo mock JWT 3 phần an toàn với UTF-8
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${safeEncode(userData)}.mockSignature`;
      localStorage.setItem('access_token', mockToken);
      setUser(userData);
      return userData;
    }
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
