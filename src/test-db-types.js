import Database from 'better-sqlite3';

const db = new Database('data/local.db');

const userIdString = '13207868';
const userIdNumber = 13207868;

console.log('Testing String ID:', userIdString);
const user1 = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdString);
console.log('Result via String:', user1 ? 'Found' : 'Not Found');

console.log('Testing Number ID:', userIdNumber);
const user2 = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdNumber);
console.log('Result via Number:', user2 ? 'Found' : 'Not Found');
