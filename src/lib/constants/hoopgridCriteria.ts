export const HOOPGRID_TEAMS = [
  { id: 579, label: 'Real Madrid' },
  { id: 571, label: 'FC Barcelona' },
  { id: 578, label: 'Panathinaikos' },
  { id: 577, label: 'Olympiacos' },
  { id: 573, label: 'Fenerbahce' },
  { id: 598, label: 'AS Monaco' },
  { id: 576, label: 'Maccabi' },
  { id: 580, label: 'Baskonia' },
  { id: 560, label: 'Anadolu Efes' },
  { id: 569, label: 'Crvena Zvezda' },
  { id: 568, label: 'Milán' },
  { id: 572, label: 'Bayern Múnich' },
  { id: 575, label: 'ASVEL' },
  { id: 713, label: 'Paris' },
  { id: 642, label: 'Partizan' },
  { id: 582, label: 'Zalgiris' },
  { id: 645, label: 'Virtus Bologna' },
  { id: 581, label: 'Valencia Basket' },
];

export const HOOPGRID_POSITIONS = [
  { value: 'Base', label: 'Base' },
  { value: 'Alero', label: 'Alero' },
  { value: 'Pivot', label: 'Pívot' },
];

export const HOOPGRID_STATS = [
  // Averages (Biwenger Points vs PIR)
  { type: 'stat_avg', field: 'fantasyPoints', threshold: 12, label: '12+ Pts Biw. (Media)' },
  { type: 'stat_avg', field: 'valuation', threshold: 15, label: '15+ PIR (Media)' },

  // Traditional Stats (Media)
  { type: 'stat_avg', field: 'points', threshold: 12, label: '12+ Puntos (Media)' },
  { type: 'stat_avg', field: 'assists', threshold: 5, label: '5+ Asis. (Media)' },
  { type: 'stat_avg', field: 'rebounds', threshold: 6, label: '6+ Reb. (Media)' },
  { type: 'stat_avg', field: 'minutes', threshold: 24, label: '24+ Min. (Media)' },

  // Sniper Achievement (Media)
  {
    type: 'percentage',
    value: { madeField: 'threePointsMade', attField: 'threePointsAttempted', threshold: 0.4 },
    label: '40%+ Triples (Media)',
  },
  { type: 'stat_avg', field: 'threePointsMade', threshold: 2.2, label: '2.2+ Triples (Media)' },

  // Single Game Peaks
  { type: 'stat_single', field: 'points', threshold: 30, label: '30+ Puntos (1 Part.)' },
  { type: 'stat_single', field: 'assists', threshold: 10, label: '10+ Asis. (1 Part.)' },
  { type: 'stat_single', field: 'rebounds', threshold: 12, label: '12+ Reb. (1 Part.)' },
  { type: 'stat_single', field: 'valuation', threshold: 35, label: '35+ PIR (1 Part.)' },
  { type: 'stat_single', field: 'steals', threshold: 4, label: '4+ Robos (1 Part.)' },
  { type: 'stat_single', field: 'blocks', threshold: 3, label: '3+ Tapones (1 Part.)' },

  // Special Achievement
  { type: 'double_double', label: 'Doble-Doble (1 Part.)' },

  // Season Totals
  { type: 'stat_total', field: 'fantasyPoints', threshold: 400, label: '400+ Pts Biw. (Total)' },
  { type: 'stat_total', field: 'threePointsMade', threshold: 50, label: '50+ Triples (Total)' },
];

export const HOOPGRID_MARKET = [
  { type: 'price_min', value: 15000000, label: 'Precio > 15M' },
  { type: 'price_min', value: 20000000, label: 'Precio > 20M' },
  { type: 'price_max', value: 5000000, label: 'Precio < 5M' },
  { type: 'price_max', value: 3000000, label: 'Ganga (< 3M)' },
];

export const HOOPGRID_OWNERSHIP = [
  { type: 'ownership', value: 'current', label: 'Jugador Fichado' },
  { type: 'ownership', value: 'free', label: 'Agente Libre' },
  { type: 'ownership', value: 'past_not_current', label: 'Fichado antes (Ahora libre)' },
  { type: 'ownership', value: 'never', label: 'Nunca Fichado' },
];

export const HOOPGRID_USER_OWNERSHIP = [
  {
    type: 'user_ownership',
    value: { userId: '13207868', mode: 'current' },
    label: 'Fichado por All Stars',
  },
  {
    type: 'user_ownership',
    value: { userId: '13207868', mode: 'past' },
    label: 'Ex-jugador de All Stars',
  },
  {
    type: 'user_ownership',
    value: { userId: '13207924', mode: 'current' },
    label: 'Fichado por ask72',
  },
  {
    type: 'user_ownership',
    value: { userId: '13207924', mode: 'past' },
    label: 'Ex-jugador de ask72',
  },
  {
    type: 'user_ownership',
    value: { userId: '13208192', mode: 'current' },
    label: 'Fichado por Real Madrid Basket',
  },
  {
    type: 'user_ownership',
    value: { userId: '13208192', mode: 'past' },
    label: 'Ex-jugador de Real Madrid Basket',
  },
  {
    type: 'user_ownership',
    value: { userId: '13207910', mode: 'current' },
    label: 'Fichado por June',
  },
  {
    type: 'user_ownership',
    value: { userId: '13207910', mode: 'past' },
    label: 'Ex-jugador de June',
  },
  {
    type: 'user_ownership',
    value: { userId: '13208960', mode: 'current' },
    label: 'Fichado por Cactus Team',
  },
  {
    type: 'user_ownership',
    value: { userId: '13208960', mode: 'past' },
    label: 'Ex-jugador de Cactus Team',
  },
  {
    type: 'user_ownership',
    value: { userId: '13209320', mode: 'current' },
    label: 'Fichado por Daniel De Castro',
  },
  {
    type: 'user_ownership',
    value: { userId: '13209320', mode: 'past' },
    label: 'Ex-jugador de Daniel De Castro',
  },
  {
    type: 'user_ownership',
    value: { userId: '13207974', mode: 'current' },
    label: 'Fichado por Nonameyet',
  },
  {
    type: 'user_ownership',
    value: { userId: '13207974', mode: 'past' },
    label: 'Ex-jugador de Nonameyet',
  },
];

export const HOOPGRID_COUNTRIES = [
  { value: 'United States of America', label: 'EE.UU.' },
  { value: 'Spain', label: 'España' },
  { value: 'France', label: 'Francia' },
  { value: 'Serbia', label: 'Serbia' },
  { value: 'Lithuania', label: 'Lituania' },
  { value: 'Greece', label: 'Grecia' },
  { value: 'Italy', label: 'Italia' },
  { value: 'Germany', label: 'Alemania' },
  { value: 'Turkey', label: 'Turquía' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Slovenia', label: 'Eslovenia' },
  { value: 'Croatia', label: 'Croacia' },
  { value: 'Latvia', label: 'Letonia' },
  { value: 'Montenegro', label: 'Montenegro' },
];
