const { Database } = require('better-sqlite3');
const db = new require('better-sqlite3')('data/local.db');

const rows = db.prepare(`SELECT * FROM fichajes LIMIT 50`).all();
console.log('Sample transfers:', rows);

const distinctSellers = db.prepare(`SELECT DISTINCT vendedor FROM fichajes`).all();
console.log('Distinct Sellers:', distinctSellers.map(s => s.vendedor));

const zeroPrice = db.prepare(`SELECT * FROM fichajes WHERE precio = 0 LIMIT 10`).all();
console.log('Zero Price Transfers:', zeroPrice);
