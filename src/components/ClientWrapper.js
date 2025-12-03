'use client';

import { UserProvider } from '@/contexts/UserContext';
import UserSelectionModal from '@/components/UserSelectionModal';

export default function ClientWrapper({ children, users }) {
  return (
    <UserProvider users={users}>
      <UserSelectionModal />
      {children}
    </UserProvider>
  );
}
