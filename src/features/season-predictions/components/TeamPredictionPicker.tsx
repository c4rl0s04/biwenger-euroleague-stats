import { SearchableSelect } from '@/components/ui/foundation';
import type { PredictionChoice } from '../models/options';

export function TeamPredictionPicker({
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
      label="Seleccionar equipo"
      options={options.map((choice) => ({
        id: choice.id,
        label: choice.name,
        image: choice.image,
      }))}
      value={value}
      onChange={onChange}
      placeholder="Elige un equipo"
      searchPlaceholder="Buscar equipo"
      emptyMessage="No hay equipos que coincidan con la búsqueda."
    />
  );
}
