import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_USER } from '../data/mockData';

const USERS_STORAGE_KEY = '@vienna_lost_found_users_v1';
const CURRENT_USER_STORAGE_KEY = '@vienna_lost_found_current_user_v1';

const DEMO_PASSWORD = 'demo1234';
const AuthContext = createContext(null);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createDemoUser() {
  return {
    id: DEFAULT_USER.id,
    name: DEFAULT_USER.name,
    email: normalizeEmail(DEFAULT_USER.email),
    phone: DEFAULT_USER.phone,
    joinedDate: DEFAULT_USER.joinedDate,
    password: DEMO_PASSWORD,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  async function loadAuthState() {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const storedCurrentUser = await AsyncStorage.getItem(CURRENT_USER_STORAGE_KEY);

      let parsedUsers = storedUsers ? JSON.parse(storedUsers) : [];

      if (!Array.isArray(parsedUsers) || parsedUsers.length === 0) {
        parsedUsers = [createDemoUser()];
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsedUsers));
      }

      setUsers(parsedUsers);

      if (storedCurrentUser) {
        setUser(JSON.parse(storedCurrentUser));
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      const demoUser = createDemoUser();
      setUsers([demoUser]);
    } finally {
      setLoading(false);
    }
  }

  async function persistUsers(nextUsers) {
    setUsers(nextUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
  }

  async function persistCurrentUser(nextUser) {
    const safeUser = {
      id: nextUser.id,
      name: nextUser.name,
      email: nextUser.email,
      phone: nextUser.phone || '',
      joinedDate: nextUser.joinedDate,
    };

    setUser(safeUser);
    await AsyncStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(safeUser));
  }

  async function login(email, password) {
    const normalizedEmail = normalizeEmail(email);
    const foundUser = users.find((candidate) => candidate.email === normalizedEmail);

    if (!foundUser || foundUser.password !== password) {
      throw new Error('Invalid email or password.');
    }

    await persistCurrentUser(foundUser);
  }


  async function signUp({ name, email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const existingUser = users.find((candidate) => candidate.email === normalizedEmail);

    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      phone: '',
      joinedDate: new Date().toISOString().split('T')[0],
      password,
    };

    const nextUsers = [newUser, ...users];
    await persistUsers(nextUsers);
    await persistCurrentUser(newUser);
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      users,
      loading,
      login,
      signUp,
      logout,
    }),
    [user, users, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return ctx;
}
