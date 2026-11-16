'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { TransferActivityList } from './TransferActivityList';

export default function MarketActivityCard() {
  const { currentUser, isReady } = useClientUser();
  const { data, loading } = useApiData(
    () => `/api/dashboard/recent-activity?userId=${currentUser?.id || ''}`,
    { dependencies: [currentUser?.id] }
  );
  if (!isReady) return null;
  const { recentTransfers } = data || {};
  return (
    <Card
      title="Últimos Fichajes"
      icon={ShoppingBag}
      color="pink"
      loading={loading}
      actionRight={
        <Link href="/market" className="text-sm text-primary hover:underline">
          Ver mercado
        </Link>
      }
      className="card-glow"
    >
      <TransferActivityList transfers={(recentTransfers ?? []).slice(0, 5)} />
    </Card>
  );
}
