'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import Image from 'next/image';

export default function UserSelectionModal() {
  const { currentUser, selectUser, users, isClient } = useClientUser();

  // Don't render on server to prevent hydration mismatch
  if (!isClient) return null;

  // User already selected, hide modal
  if (currentUser) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[hsl(220,18%,10%)] border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">¿Quién eres?</h2>

        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.user_id}
              onClick={() => selectUser(user.user_id)}
              className="w-full flex items-center gap-3 p-3 bg-[hsl(220,18%,10%)] hover:bg-[hsl(220,18%,15%)] border border-border hover:border-primary rounded-xl transition-all cursor-pointer"
            >
              {user.icon ? (
                <div className="relative w-8 h-8 shrink-0">
                  <Image
                    src={user.icon}
                    alt={user.name}
                    fill
                    className="rounded-full object-cover"
                    sizes="32px"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="text-white font-medium">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
