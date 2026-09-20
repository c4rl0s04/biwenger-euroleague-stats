/** Current owned-player facts, not enriched profile analytics or provider credentials. */
export interface OwnedPlayer {
  id: number;
  name: string | null;
  teamId: number | null;
  teamName: string | null;
  teamCode: string | null;
  position: string | null;
  price: number | null;
  imageUrl: string | null;
  points: number | null;
}
