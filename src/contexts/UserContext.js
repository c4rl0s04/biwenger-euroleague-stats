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

      // Sync to cookie for server-side access (1 year expiry)
      document.cookie = `NEXT_USER_ID=${user.user_id}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  const clearUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('selectedUser');
    // Clear cookie
    document.cookie = 'NEXT_USER_ID=; path=/; max-age=0; SameSite=Lax';
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
