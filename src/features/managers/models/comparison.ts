/** Fantasy identities and squad statistics, not account or provider records. */
export interface ComparisonManager {
  id: string | number;
  name: string | null;
  icon: string | null;
  color_index: number | null;
}
export interface ComparisonSquadMember {
  id: number;
  name: string | null;
  position: string | null;
  team: string | null;
  price: number;
  points: number;
  average: number;
  status: string | null;
}
