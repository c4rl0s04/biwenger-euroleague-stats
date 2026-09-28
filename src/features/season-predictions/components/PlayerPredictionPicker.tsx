import { SearchableSelect } from '@/components/ui/foundation';
import type { PredictionChoice } from '../models/options';

export function PlayerPredictionPicker({
  options,
  value,
  onChange,
}: {
  options: readonly PredictionChoice[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <SearchableSelect
      label="Seleccionar jugador"
      options={options.map((option) => ({
        id: option.id,
        label: option.name,
        description: option.detail,
        image: option.image,
      }))}
      value={value}
      onChange={onChange}
      placeholder="Elige un jugador"
      searchPlaceholder="Buscar jugador o equipo"
      emptyMessage="No hay jugadores que coincidan con la búsqueda."
    />
  );
}
