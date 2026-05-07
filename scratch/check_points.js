const baldwin = [
  22, 41, 17, 18, 12, 18, 22, 17, 25, 22, 10, 21, 23, 21, 20, 22, 20, 36, 36, 29, 21, 23, 31, 26,
  23, 16, 21, 20, 25, 32, 14, 28, 23,
];
console.log(
  'Baldwin Total:',
  baldwin.reduce((a, b) => a + b, 0)
);

const sorkin = [0, 16, 19, 35, 21, 12, 26, 19, 15, 28, 28, 23, 37, 19, 13, 25, 28, 23, 17, 25];
console.log(
  'Sorkin Total:',
  sorkin.reduce((a, b) => a + b, 0)
);

const vezenkov = [
  40, 17, 35, 28, 17, 17, 21, 23, 14, 17, 31, 29, 29, 33, 30, 19, 31, 32, 36, 34, 34, 24, 33, 17,
  33, 29, 28, 21, 33, 38, 26, 17, 32, 18,
];
console.log(
  'Vezenkov Total:',
  vezenkov.reduce((a, b) => a + b, 0)
);
