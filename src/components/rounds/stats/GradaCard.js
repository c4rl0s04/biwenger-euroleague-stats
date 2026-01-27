import { useState } from 'react';
import { UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import GradaList from '../GradaList';
import { cn } from '@/lib/utils';

export default function GradaCard({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !user.leftOut || user.leftOut.length === 0) return null;

  return (
    <ElegantCard
      title="Grada"
      icon={UserCheck}
      className="w-full transition-all duration-300"
      color="zinc"
      actionRight={
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white cursor-pointer"
        >
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      }
    >
      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
        )}
      >
        <GradaList players={user.leftOut} />
      </div>

      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          className="text-xs text-center text-muted-foreground mt-0 cursor-pointer hover:text-zinc-300 transition-colors py-1"
        >
          {user.leftOut.length} jugadores no convocados
        </div>
      )}
    </ElegantCard>
  );
}
