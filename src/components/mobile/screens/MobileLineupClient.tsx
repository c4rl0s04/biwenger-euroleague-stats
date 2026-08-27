'use client';

import { Check, LoaderCircle, Save, Star, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { deriveRotation, normalizeLineupConfig, performSwap } from '@/lib/utils/lineup-logic';

import MobileBottomSheet from '../MobileBottomSheet';
import { MobileScreen, MobileScreenHeader, MobileSectionHeading, MobileSectionLink } from '../MobileScreen';

type Player = Record<string, any>;
type LineupConfig = Record<string, any>;

export default function MobileLineupClient({ userId }: { userId: string | number }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [squad, setSquad] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [lineupConfig, setLineupConfig] = useState<LineupConfig>({ playersID: [], reservesID: [], captain: null, type: '2-2-1' });

  useEffect(() => {
    let active = true;
    Promise.all([
      apiClient.get(`/api/player/squad?userId=${userId}`),
      apiClient.get('/api/users/lineup'),
    ])
      .then(([squadResponse, lineupResponse]) => {
        if (!active) return;
        if (squadResponse.success) setSquad(squadResponse.data?.players ?? []);
        if (lineupResponse.success) setLineupConfig(normalizeLineupConfig(lineupResponse.data?.lineup));
      })
      .catch(() => active && setMessage('No se pudo cargar tu alineación.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [userId]);

  const rotation = useMemo(() => deriveRotation(lineupConfig, squad), [lineupConfig, squad]);

  const swapWith = (player: Player) => {
    if (!selected) return;
    setLineupConfig((current) => performSwap(selected.id, player.id, current));
    setSelected(null);
  };

  const setCaptain = () => {
    if (!selected) return;
    setLineupConfig((current) => ({ ...current, captain: Number(selected.id) }));
    setSelected(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const result = await apiClient.saveLineup(lineupConfig);
      setMessage(result.success ? 'Alineación guardada.' : result.message ?? 'No se pudo guardar.');
    } catch {
      setMessage('No se pudo guardar la alineación.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mobile-lineup-loading"><LoaderCircle className="animate-spin" aria-hidden="true" /> Cargando alineación</div>;

  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-has-sticky-action">
      <MobileScreenHeader eyebrow="Tu equipo" title="Alineación" description="Quinteto, capitán y banquillo" />
      {message && <p className="mobile-lineup-message" role="status">{message}</p>}
      <MobileSectionHeading>Quinteto</MobileSectionHeading>
      <div className="mobile-lineup-court" aria-label="Quinteto titular">
        {rotation.starters.map((player: Player, index: number) => (
          <button key={String(player.id)} type="button" onClick={() => setSelected(player)} className={`mobile-lineup-player mobile-lineup-slot-${index + 1}`}>
            {Number(lineupConfig.captain) === Number(player.id) && <Star size={14} aria-label="Capitán" />}
            <strong>{player.name}</strong><span>{player.position ?? player.team_name}</span>
          </button>
        ))}
      </div>
      <MobileSectionHeading>Banquillo</MobileSectionHeading>
      <div className="mobile-lineup-bench">
        {rotation.bench.map((player: Player) => <button key={String(player.id)} type="button" onClick={() => setSelected(player)}><strong>{player.name}</strong><span>{player.position ?? 'Reserva'}</span></button>)}
      </div>
      <MobileSectionHeading>Gestión</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/lineup/squad" title="Plantilla" description="Valor, forma y situación de cada jugador" icon={Users} accent="green" />
        <MobileSectionLink href="/lineup/offers" title="Ofertas" description="Revisar y responder propuestas" icon={Check} />
        <MobileSectionLink href="/lineup/analysis" title="Análisis" description="Equilibrio y alternativas del quinteto" icon={Star} accent="violet" />
      </div>
      <div className="mobile-sticky-action-bar"><button type="button" className="mobile-primary-action mobile-save-lineup" onClick={save} disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />} Guardar alineación</button></div>
      <MobileBottomSheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? 'Jugador'} description="Cambia su posición o asígnale la capitanía">
        {selected && (
          <div className="mobile-lineup-actions">
            {rotation.starters.some((player: Player) => Number(player.id) === Number(selected.id)) && <button type="button" className="mobile-primary-action" onClick={setCaptain}><Star size={18} aria-hidden="true" /> Hacer capitán</button>}
            <p>Cambiar por</p>
            {[...rotation.starters, ...rotation.bench].filter((player: Player) => Number(player.id) !== Number(selected.id)).map((player: Player) => <button key={String(player.id)} type="button" onClick={() => swapWith(player)} className="mobile-lineup-swap"><span>{player.name}</span><small>{player.position ?? 'Jugador'}</small></button>)}
          </div>
        )}
      </MobileBottomSheet>
    </MobileScreen>
  );
}
