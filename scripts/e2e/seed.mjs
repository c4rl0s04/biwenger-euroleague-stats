import { readFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { assertFixtureTarget } from './safety.mjs';

const connectionString = process.env.E2E_DATABASE_URL;
assertFixtureTarget(connectionString, process.env);
const client = new pg.Client({ connectionString });
await client.connect();
try {
  const existing = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  if (existing.rowCount)
    throw new Error(
      'Fixture seeding requires an empty database; refusing to modify existing tables.'
    );
  // This role setup is confined to the fresh, disposable PostgreSQL instance.
  await client.query(
    "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;"
  );
  const root = path.resolve(import.meta.dirname, '../..');
  const journal = JSON.parse(readFileSync(path.join(root, 'drizzle/meta/_journal.json'), 'utf8'));
  await client.query('BEGIN');
  for (const entry of journal.entries) {
    const sql = readFileSync(path.join(root, 'drizzle', `${entry.tag}.sql`), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint')) {
      if (statement.trim()) await client.query(statement);
    }
  }
  const passwordHash = await bcrypt.hash('fixture-only-password', 10);
  await client.query(
    "INSERT INTO users (id,name,email,password,color_index) VALUES ('99001','Fixture Manager','fixture@example.invalid',$1,0),('99002','Fixture Rival','rival@example.invalid',$1,1)",
    [passwordHash]
  );
  await client.query(
    "INSERT INTO user_seasons (season_id,user_id) VALUES ('2025-26','99001'),('2025-26','99002')"
  );
  await client.query(
    "INSERT INTO teams (id,name,short_name,code,img) VALUES (9901,'Fixture Madrid','Madrid','FMA','/icons/icon-192.png'),(9902,'Fixture Athens','Athens','FAT','/icons/icon-192.png')"
  );
  await client.query(
    "INSERT INTO matches (season_id,id,round_id,round_name,home_id,away_id,home_score,away_score,date,status) VALUES ('2025-26',99001,1,'Jornada 1',9901,9902,84,79,'2025-10-01T18:00:00Z','finished')"
  );
  await client.query(
    "INSERT INTO players (id,name,position,img) VALUES (99101,'Fixture Guard','1','/icons/icon-192.png')"
  );
  await client.query(
    "INSERT INTO player_seasons (season_id,player_id,team_id,owner_id,puntos,partidos_jugados,price,price_increment,status) VALUES ('2025-26',99101,9901,'99001',24,1,1500000,25000,'ok')"
  );
  // Profile-only historical facts: no changes to the existing Team/Matches fixture projections.
  await client.query(
    "INSERT INTO user_rounds (season_id,user_id,round_id,round_name,points,participated) VALUES ('2025-26','99001',1,'Jornada 1',24,TRUE),('2025-26','99001',2,'Jornada 2',31,TRUE),('2025-26','99002',1,'Jornada 1',20,TRUE),('2025-26','99002',2,'Jornada 2',35,TRUE)"
  );
  for (let index = 1; index <= 12; index++) {
    const playerId = 99200 + index;
    await client.query(
      "INSERT INTO players (id,name,position,img) VALUES ($1,$2,'1','/icons/icon-192.png')",
      [playerId, `Fixture Contributor ${String(index).padStart(2, '0')}`]
    );
    await client.query(
      "INSERT INTO player_round_stats (season_id,player_id,round_id,fantasy_points) VALUES ('2025-26',$1,1,$2)",
      [playerId, 20 - index]
    );
    await client.query(
      "INSERT INTO lineups (season_id,user_id,round_id,round_name,player_id,is_captain,role) VALUES ('2025-26','99001',1,'Jornada 1',$1,FALSE,'titular')",
      [playerId]
    );
  }
  await client.query(
    "INSERT INTO tournaments (season_id,id,name,type,status,data_json,updated_at) VALUES ('2025-26',99301,'Fixture Profile League','league','active','{}',1),('2025-26',99302,'Fixture Profile Cup','playoff','finished',$1,2)",
    [
      JSON.stringify({
        winner: { id: 99001, name: 'Fixture Manager', icon: '/icons/icon-192.png' },
      }),
    ]
  );
  await client.query(
    "INSERT INTO tournament_standings (season_id,tournament_id,phase_name,group_name,user_id,position,points,won,drawn,lost,scored,against) VALUES ('2025-26',99301,'League','A','99001',1,12,4,0,0,90,70)"
  );
  await client.query('COMMIT');
  console.log('Disposable E2E schema and synthetic league fixture ready.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
