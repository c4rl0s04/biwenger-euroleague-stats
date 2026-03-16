import 'dotenv/config';
import { sql } from 'drizzle-orm';

async function seedTeamLocations() {
  console.log('🌱 Updating Team Locations for 2025-26 Season...');

  // Dynamically import db after dotenv
  const { db } = await import('../../src/lib/db/index.js');
  const { teams } = await import('../../src/lib/db/schema.js');

  const teamData = [
    { name: 'Real Madrid', city: 'Madrid', arena: 'WiZink Center', lat: 40.4241, lng: -3.6717 },
    {
      name: 'FC Barcelona',
      city: 'Barcelona',
      arena: 'Palau Blaugrana',
      lat: 41.3809,
      lng: 2.1228,
    },
    {
      name: 'Baskonia Vitoria-Gasteiz',
      city: 'Vitoria-Gasteiz',
      arena: 'Fernando Buesa Arena',
      lat: 42.8592,
      lng: -2.645,
    },
    {
      name: 'Valencia Basket',
      city: 'Valencia',
      arena: 'Pabellón Fuente de San Luis',
      lat: 39.45,
      lng: -0.3667,
    },
    {
      name: 'Panathinaikos Athens',
      city: 'Athens',
      arena: 'OAKA Altion',
      lat: 38.0361,
      lng: 23.8319,
    },
    {
      name: 'Olympiacos Piraeus',
      city: 'Piraeus',
      arena: 'Peace and Friendship Stadium',
      lat: 37.9472,
      lng: 23.6672,
    },
    {
      name: 'Fenerbahce Beko Istanbul',
      city: 'Istanbul',
      arena: 'Ülker Sports Arena',
      lat: 40.9919,
      lng: 29.1219,
    },
    {
      name: 'Anadolu Efes Istanbul',
      city: 'Istanbul',
      arena: 'Sinan Erdem Dome',
      lat: 40.9881,
      lng: 28.8211,
    },
    {
      name: 'EA7 Emporio Armani Milan',
      city: 'Milan',
      arena: 'Mediolanum Forum',
      lat: 45.4019,
      lng: 9.1417,
    },
    {
      name: 'Virtus Segafredo Bologna',
      city: 'Bologna',
      arena: 'Segafredo Arena',
      lat: 44.5126,
      lng: 11.37,
    },
    { name: 'AS Monaco', city: 'Monaco', arena: 'Salle Gaston Médecin', lat: 43.7275, lng: 7.4161 },
    {
      name: 'LDLC ASVEL Villeurbanne',
      city: 'Villeurbanne',
      arena: 'Astroballe',
      lat: 45.7744,
      lng: 4.8856,
    },
    { name: 'Paris Basketball', city: 'Paris', arena: 'Adidas Arena', lat: 48.892, lng: 2.36 },
    { name: 'FC Bayern Munich', city: 'Munich', arena: 'BMW Park', lat: 48.1133, lng: 11.5317 },
    {
      name: 'Maccabi Playtika Tel Aviv',
      city: 'Tel Aviv',
      arena: 'Menora Mivtachim Arena',
      lat: 32.0622,
      lng: 34.7917,
    },
    {
      name: 'Hapoel IBI Tel Aviv',
      city: 'Tel Aviv',
      arena: 'Shlomo Group Arena',
      lat: 32.11,
      lng: 34.82,
    },
    {
      name: 'Zalgiris Kaunas',
      city: 'Kaunas',
      arena: 'Zalgirio Arena',
      lat: 54.8903,
      lng: 23.9147,
    },
    {
      name: 'Partizan Mozzart Bet Belgrade',
      city: 'Belgrade',
      arena: 'Stark Arena',
      lat: 44.8144,
      lng: 20.4203,
    },
    {
      name: 'Crvena Zvezda Meridianbet Belgrade',
      city: 'Belgrade',
      arena: 'Aleksandar Nikolić Hall',
      lat: 44.8156,
      lng: 20.4853,
    },
    {
      name: 'Dubai Basketball',
      city: 'Dubai',
      arena: 'Coca-Cola Arena',
      lat: 25.2078,
      lng: 55.2711,
    },
  ];

  try {
    for (const team of teamData) {
      console.log(`Updating ${team.name}...`);
      await db
        .update(teams)
        .set({
          city: team.city,
          arenaName: team.arena,
          latitude: team.lat,
          longitude: team.lng,
        })
        .where(sql`name = ${team.name}`);
    }
    console.log('✅ Team locations updated!');
  } catch (error) {
    console.error('❌ Error updating team locations:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedTeamLocations();
