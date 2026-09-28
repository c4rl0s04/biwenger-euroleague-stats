import { SearchableSelect } from '@/components/ui/foundation';
import type { PredictionChoice } from '../models/options';

export function ManagerPredictionPicker({
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
      label="Seleccionar mánager"
      options={options.map((option) => ({
        id: option.id,
        label: option.name,
        image: option.image,
      }))}
      value={value}
      onChange={onChange}
      placeholder="Elige un mánager"
      searchPlaceholder="Buscar mánager"
      emptyMessage="No hay mánagers que coincidan con la búsqueda."
    />
  );
}
