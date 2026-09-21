export interface LeaderGap {
  leader_name: string | null;
  leader_points: number;
  user_points: number;
  gap: number;
  gap_to_second: number;
  rounds_needed: number;
  is_leader: boolean;
}
