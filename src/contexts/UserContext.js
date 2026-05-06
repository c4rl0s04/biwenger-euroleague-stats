'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const UserContext = createContext();

export function UserProvider({ children, users }) {
  const { data: session, status } = useSession();

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const savedUser = localStorage.getItem('selectedUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Sync with Auth.js session
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userData = {
        id: session.user.id,
        name: session.user.name,
        icon: session.user.image,
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUser(userData);
      localStorage.setItem('selectedUser', JSON.stringify(userData));
      document.cookie = `NEXT_USER_ID=${session.user.id}; path=/; max-age=31536000; SameSite=Lax`;
    } else if (status === 'unauthenticated') {
      // Clear state on sign out

      setCurrentUser(null);
      localStorage.removeItem('selectedUser');
      document.cookie = 'NEXT_USER_ID=; path=/; max-age=0; SameSite=Lax';
    }
  }, [session, status]);

  const [isLoading] = useState(false);

  const selectUser = (userId) => {
    // Disable manual selection if logged in
    if (status === 'authenticated') return;

    if (!users || !Array.isArray(users)) return;
    const user = users.find((u) => u.user_id === userId);
    if (user) {
      const userData = {
        id: user.user_id,
        name: user.name,
        icon: user.icon,
      };
      setCurrentUser(userData);
      localStorage.setItem('selectedUser', JSON.stringify(userData));
      document.cookie = `NEXT_USER_ID=${user.user_id}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    }
  };

  const clearUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('selectedUser');
    document.cookie = 'NEXT_USER_ID=; path=/; max-age=0; SameSite=Lax';
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        selectUser,
        clearUser,
        isLoading,
        users,
        isAuthenticated: status === 'authenticated',
      }}
    >
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
