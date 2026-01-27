import { UserCheck } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import GradaList from '../GradaList';

export default function GradaCard({ user }) {
  if (!user || !user.leftOut || user.leftOut.length === 0) return null;

  return (
    <ElegantCard title="Banquillo y Grada" icon={UserCheck} className="w-full" color="zinc">
      <GradaList players={user.leftOut} />
    </ElegantCard>
  );
}
