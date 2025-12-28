'use client';

import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children, users }) {
  const [currentUser, setCurrentUser] = useState(() => {
    // Lazy initialization: read from localStorage on first render (client-side only)
    if (typeof window === 'undefined') return null;
    try {
      const savedUser = localStorage.getItem('selectedUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Error parsing saved user:', e);
      return null;
    }
  });
  const [isLoading] = useState(false);

  const selectUser = (userId) => {
    if (!users || !Array.isArray(users)) {
      console.warn('Users not available yet');
      return;
    }
    const user = users.find((u) => u.user_id === userId);
    if (user) {
      const userData = {
        id: user.user_id,
        name: user.name,
        icon: user.icon,
      };
      setCurrentUser(userData);
      localStorage.setItem('selectedUser', JSON.stringify(userData));
    }
  };

  const clearUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('selectedUser');
  };

  return (
    <UserContext.Provider value={{ currentUser, selectUser, clearUser, isLoading, users }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
