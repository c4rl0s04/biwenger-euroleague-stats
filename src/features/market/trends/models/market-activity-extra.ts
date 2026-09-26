export interface RecentTransfer {
  id: number | null;
  season_id: string | null;
  timestamp: number | string | null;
  fecha: string | null;
  player_id: number | null;
  precio: number | null;
  vendedor: string | null;
  comprador: string | null;
  player_name: string | null;
  position: string | null;
  vendedor_id: string | null;
  vendedor_color_index: number | null;
  comprador_id: string | null;
  comprador_color_index: number | null;
}
export interface PriceChange {
  player_id: number | null;
  name: string | null;
  position: string | null;
  team: string | null;
  price: number | null;
  price_increment: number | null;
  owner_id: string | null;
}
