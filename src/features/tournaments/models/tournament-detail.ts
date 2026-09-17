/** JSON values supported as text children by the historical winner banner. */
export type TournamentDisplayText = string | number | boolean | null | TournamentDisplayText[];

export interface TournamentPhoneDetail {
  id: number;
  name: string | null;
  type: string | null;
  status: string | null;
  winner: null | false | 0 | '' | { name: TournamentDisplayText };
}

export interface TournamentDesktopDetail extends Omit<TournamentPhoneDetail, 'winner'> {
  winner:
    | null
    | false
    | 0
    | ''
    | {
        name: TournamentDisplayText;
        iconUrl: string | null;
        href: string;
      };
}
