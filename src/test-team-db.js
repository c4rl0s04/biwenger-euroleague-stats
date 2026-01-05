import { db } from './lib/db/client.js';

const id = 571;
console.log(`Testing DB fetch for ID: ${id}`);

try {
  const query = `
    SELECT 
      id,
      name,
      short_name,
      img as logo
    FROM teams
    WHERE id = ?
  `;
  const team = db.prepare(query).get(id);
  console.log('Result:', team);
} catch (error) {
  console.error('DB Error:', error);
}
