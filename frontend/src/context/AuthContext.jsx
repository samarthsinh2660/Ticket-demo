import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Helper to write to cookies
export const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

// Helper to read from cookies
export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Helper to erase cookies
export const eraseCookie = (name) => {
  document.cookie = name + '=; Max-Age=-99999999; path=/;';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = getCookie('accessToken');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('user');
        eraseCookie('accessToken');
        eraseCookie('refreshToken');
      }
    } else {
      localStorage.removeItem('user');
      eraseCookie('accessToken');
      eraseCookie('refreshToken');
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const response = await api.post('/auth/login', { email, password, role });
    const { user: userData, accessToken, refreshToken } = response.data.data;
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCookie('accessToken', accessToken, 2); // 48h (2 days)
    setCookie('refreshToken', refreshToken, 7); // 7 days
    
    return userData;
  };

  const signup = async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password });
    const { user: userData, accessToken, refreshToken } = response.data.data;
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCookie('accessToken', accessToken, 2); // 48h
    setCookie('refreshToken', refreshToken, 7); // 7 days
    
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    eraseCookie('accessToken');
    eraseCookie('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
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
