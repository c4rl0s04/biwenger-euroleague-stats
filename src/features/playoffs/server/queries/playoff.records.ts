export interface PlayoffFacts {
  allUsers: { id: string; name: string | null; icon: string | null; colorIndex: number }[];
  predictions: {
    id: number;
    seasonId: string;
    userId: string | null;
    stage: string | null;
    matchId: string | null;
    predictedWinnerId: number | null;
    predictionDetails: string | null;
    points: number | null;
    createdAt: Date | null;
  }[];
  results: {
    matchId: string | null;
    winnerId: number | null;
    score: string | null;
    isCompleted: boolean | null;
  }[];
  media: { userId: string | null; predictionImageUrl: string | null }[];
}
