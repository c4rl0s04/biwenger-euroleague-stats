/** Static synthetic facts, applied only inside seed.mjs's guarded fresh-database transaction.
 * Historical dates intentionally do not populate the rolling trends window. Its coverage
 * must be separate rather than making every screenshot depend on today's date.
 */
export const marketFixtureStatements = [
  [
    "UPDATE user_seasons SET name = CASE user_id WHEN '99001' THEN 'Fixture Manager' ELSE 'Fixture Rival' END, color_index = CASE user_id WHEN '99001' THEN 0 ELSE 1 END WHERE season_id = '2025-26' AND user_id IN ('99001','99002')",
  ],
  [
    "INSERT INTO players (id,name,position,img) VALUES (99311,'Fixture Market Wing','2','/icons/icon-192.png'),(99312,'Fixture Market Center','3','/icons/icon-192.png'),(99313,'Fixture Market Free','1','/icons/icon-192.png')",
  ],
  [
    "INSERT INTO player_seasons (season_id,player_id,team_id,owner_id,puntos,partidos_jugados,price,price_increment,status) VALUES ('2025-26',99311,9901,'99002',40,2,3500000,100000,'ok'),('2025-26',99312,9902,'99001',18,2,800000,-50000,'ok'),('2025-26',99313,9902,NULL,24,2,1200000,25000,'ok')",
  ],
  [
    "INSERT INTO player_round_stats (season_id,player_id,round_id,fantasy_points) VALUES ('2025-26',99101,1,24),('2025-26',99311,1,22),('2025-26',99311,2,18),('2025-26',99312,1,8),('2025-26',99312,2,10),('2025-26',99313,1,11),('2025-26',99313,2,13)",
  ],
  [
    "INSERT INTO fichajes (id,season_id,timestamp,fecha,player_id,precio,vendedor,comprador) VALUES (99701,'2025-26',1756684800,'2025-09-01',99101,1000000,'Mercado','Fixture Manager'),(99702,'2025-26',1756771200,'2025-09-02',99311,2000000,'Mercado','Fixture Manager'),(99703,'2025-26',1757462400,'2025-09-10',99311,3000000,'Fixture Manager','Fixture Rival'),(99704,'2025-26',1756857600,'2025-09-03',99312,2000000,'Mercado','Fixture Rival'),(99705,'2025-26',1757548800,'2025-09-11',99312,1000000,'Fixture Rival','Fixture Manager')",
  ],
  [
    "INSERT INTO transfer_bids (season_id,transfer_id,bidder_id,bidder_name,amount) VALUES ('2025-26',99701,'99002','Fixture Rival',900000),('2025-26',99702,'99002','Fixture Rival',1800000),('2025-26',99703,'99001','Fixture Manager',2800000),('2025-26',99704,'99001','Fixture Manager',1900000)",
  ],
  [
    "INSERT INTO market_listings (season_id,player_id,listed_at,price,seller_id) VALUES ('2025-26',99101,'2025-10-01',1600000,'99001'),('2025-26',99311,'2025-10-01',3800000,'99002'),('2025-26',99313,'2025-10-01',1200000,NULL)",
  ],
];
