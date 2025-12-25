'use client';

import { useUser } from '@/contexts/UserContext';
import { ChevronDown, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { UserAvatar } from '@/components/ui';

export default function UserSelector() {
  const { currentUser, selectUser, users } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
      >
        <UserCircle2 className="w-4 h-4 text-orange-500" />
        <span className="text-white text-sm hidden sm:block">{currentUser.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[70] overflow-hidden">
            {users.map((user) => (
              <button
                key={user.user_id}
                onClick={() => {
                  selectUser(user.user_id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left ${
                  currentUser.id === user.user_id ? 'bg-slate-800' : ''
                }`}
              >
                <UserAvatar src={user.icon} alt={user.name} size={24} className="flex-shrink-0" />
                <span
                  className={`text-sm truncate ${
                    currentUser.id === user.user_id ? 'text-orange-500 font-medium' : 'text-white'
                  }`}
                >
                  {user.name}
                </span>
                {currentUser.id === user.user_id && (
                  <div className="ml-auto text-orange-500 text-xs">✓</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
