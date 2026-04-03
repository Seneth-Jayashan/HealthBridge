import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMeRequest, loginRequest, registerRequest } from '../services/auth.service';
import { getCookie, removeCookie, setCookie } from '../utils/cookies';

const AuthContext = createContext(null);

const USER_COOKIE = 'hb_user';
const TOKEN_COOKIE = 'hb_access_token';

const parseUserCookie = () => {
  const rawValue = getCookie(USER_COOKIE);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const persistSession = ({ token, user }) => {
  if (token) {
    setCookie(TOKEN_COOKIE, token, 1);
  }

  if (user) {
    setCookie(USER_COOKIE, JSON.stringify(user), 1);
  }
};

const clearSession = () => {
  removeCookie(TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
};

const normalizeUser = (payload) => ({
  id: payload._id || payload.id,
  name: payload.name,
  email: payload.email,
  role: payload.role,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(parseUserCookie());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie(TOKEN_COOKIE);
    const cachedUser = parseUserCookie();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    const bootstrap = async () => {
      try {
        const me = await getMeRequest();
        const normalized = normalizeUser(me);
        setUser(normalized);
        persistSession({ token, user: normalized });
      } catch {
        clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (credentials) => {
    const response = await loginRequest(credentials);
    const normalizedUser = normalizeUser(response);

    persistSession({ token: response.token, user: normalizedUser });
    setUser(normalizedUser);

    return normalizedUser;
  };

  const register = async (payload) => {
    const response = await registerRequest(payload);
    const normalizedUser = normalizeUser(response);

    persistSession({ token: response.token, user: normalizedUser });
    setUser(normalizedUser);

    return normalizedUser;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const hasRole = (allowedRoles = []) => {
    if (!user?.role) return false;
    return allowedRoles.includes(user.role);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      hasRole,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
