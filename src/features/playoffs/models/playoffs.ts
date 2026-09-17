export interface PlayoffPrediction {
  id: number;
  seasonId: string;
  userId: string | null;
  stage: string | null;
  matchId: string | null;
  predictedWinnerId: number | null;
  predictionDetails: string | null;
  points: number | null;
  createdAt: string | null;
  isCorrect: boolean | null;
  actualWinnerId: number | null | undefined;
  resultScore: string | null | undefined;
}

export interface PlayoffLeaderboardRow {
  userId: string;
  userName: string | null;
  userIcon: string | null;
  colorIndex: number;
  points: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  imageUrl: string | null | undefined;
  predictions: PlayoffPrediction[];
}
