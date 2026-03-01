import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

type User = {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phoneNumber?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeBusiness');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('permissions');
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    if (token) {
      api.get('/users/profile')
        .then(res => setUser(res.data))
        .catch(() => logout());
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);