'use client';

import { useState } from 'react';
import { useClientUser } from '@/lib/hooks/useClientUser';
import { ChevronDown, UserCircle2 } from 'lucide-react';
import { UserAvatar } from '@/components/ui';

export default function UserSelector() {
  const { currentUser, selectUser, users, isClient } = useClientUser();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render on server or if no user to prevent hydration mismatch
  if (!isClient || !currentUser) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-secondary border border-border rounded-lg transition-colors cursor-pointer"
      >
        <UserCircle2 className="w-4 h-4 text-primary" />
        <span className="text-foreground text-sm hidden sm:block">{currentUser.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-2xl z-[70] overflow-hidden">
            {Array.isArray(users) &&
              users.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => {
                    selectUser(user.user_id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left cursor-pointer ${
                    currentUser.id === user.user_id ? 'bg-secondary' : ''
                  }`}
                >
                  <UserAvatar src={user.icon} alt={user.name} size={24} className="flex-shrink-0" />
                  <span
                    className={`text-sm truncate ${
                      currentUser.id === user.user_id
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {user.name}
                  </span>
                  {currentUser.id === user.user_id && (
                    <div className="ml-auto text-primary text-xs">✓</div>
                  )}
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
