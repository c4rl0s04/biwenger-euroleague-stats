import { useState } from 'react';
import { UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import GradaList from '../GradaList';
import { cn } from '@/lib/utils';

export default function GradaCard({ user }) {
  if (!user || !user.leftOut || user.leftOut.length === 0) return null;

  return (
    <ElegantCard title="Grada" icon={UserCheck} color="zinc" bgColor="zinc" className="card-glow">
      <div className="mt-2">
        <GradaList players={user.leftOut} />
      </div>
    </ElegantCard>
  );
}
