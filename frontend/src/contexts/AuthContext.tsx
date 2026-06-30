import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  user_id: string;
  name: string;
  email: string;
  provider?: 'google' | 'local';
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  continueAsGuest: () => void;
  isAuthenticated: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const navigate = useNavigate();

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    navigate('/');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const continueAsGuest = () => {
    const guestToken = `guest_${Math.random().toString(36).substring(2, 15)}`;
    const guestUser = {
      user_id: guestToken,
      name: "Guest",
      email: "guest@local"
    };

    setToken(guestToken);
    setUser(guestUser);

    localStorage.setItem("token", guestToken);
    localStorage.setItem("user", JSON.stringify(guestUser));

    navigate("/");
  };

  const isGuest = Boolean(token?.startsWith('guest_'));
  const isAuthenticated = Boolean(token && !isGuest);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, continueAsGuest, isAuthenticated, isGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

