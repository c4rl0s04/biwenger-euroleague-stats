'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { Section } from '@/components/layout';

export default function MarketPageClient() {
  return (
    <div>
      <Section title="Resumen" delay={0} background="section-base">
        <ElegantCard title="Mercado y Fichajes" icon={ShoppingCart} color="green">
          <div className="p-8 text-center text-zinc-500">Contenido del mercado próximamente...</div>
        </ElegantCard>
      </Section>
    </div>
  );
}
