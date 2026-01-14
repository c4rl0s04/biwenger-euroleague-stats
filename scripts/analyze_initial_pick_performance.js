import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../data/local.db'));

function analyzeInitialPicks() {
  console.log('📊 Analyzing Initial Pick Performance (via Lineups)...');

  // Logic:
  // 1. Get all players in each user's Initial Squad.
  // 2. Check the `lineups` table to see when these specific players were actually played by that user.
  // 3. Sum the points from `player_round_stats` for those specific occurrences.

  // Weights:
  // - titular: 1.0
  // - 6th_man: 0.75
  // - suplente: 0.5 (bench)

  const query = `
    SELECT 
      u.name as user_name,
      l.round_name,
      p.name as player_name,
      l.role,
      prs.fantasy_points as raw_points,
      CASE 
          WHEN l.role = 'titular' THEN prs.fantasy_points * 1.0
          WHEN l.role = '6th_man' THEN prs.fantasy_points * 0.75
          WHEN l.role = 'suplente' THEN prs.fantasy_points * 0.5
          ELSE 0
      END as weighted_points
    FROM initial_squads isq
    JOIN users u ON isq.user_id = u.id
    JOIN lineups l ON isq.player_id = l.player_id AND isq.user_id = l.user_id
    JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    JOIN players p ON isq.player_id = p.id
    ORDER BY u.name, l.round_id ASC, weighted_points DESC
  `;

  const rows = db.prepare(query).all();

  console.log('\n🏆 Detailed Initial Squad Performance (By Round):\n');
  
  // Group by User -> Round
  const report = {}; 

  rows.forEach(row => {
    if (!report[row.user_name]) report[row.user_name] = {};
    if (!report[row.user_name][row.round_name]) report[row.user_name][row.round_name] = [];
    
    report[row.user_name][row.round_name].push(row);
  });

  // Print Report
  const leaderboard = [];

  for (const [user, rounds] of Object.entries(report)) {
    console.log(`\n👤 ${user}`);
    let userTotal = 0;

    for (const [round, players] of Object.entries(rounds)) {
      console.log(`  📅 ${round}`);
      let roundTotal = 0;
      
      players.forEach(p => {
        const pts = parseFloat(p.weighted_points);
        roundTotal += pts;
        userTotal += pts;
        
        const roleIcon = p.role === 'titular' ? '🟢' : (p.role === '6th_man' ? '🔵' : '⚪');
        
        console.log(`    ${roleIcon} ${p.player_name.padEnd(25)} | ${p.raw_points} raw -> ${pts.toFixed(1)} pts (${p.role})`);
      });
      console.log(`    --------------------------------------------------`);
      console.log(`    Total Round: ${roundTotal.toFixed(1)} pts\n`);
    }
    console.log(`  🏆 TOTAL USER: ${userTotal.toFixed(1)} pts`);
    console.log(`  ==================================================`);
    
    leaderboard.push({ user, total: userTotal });
  }

  // Final Classification (Actual)
  console.log('\n🏆 FINAL CLASSIFICATION (Actual Yield from Initial Picks):');
  leaderboard.sort((a, b) => b.total - a.total);
  leaderboard.forEach((entry, idx) => {
    console.log(`${(idx + 1).toString().padStart(2)}. ${entry.user.padEnd(20)}: ${entry.total.toFixed(1)} pts`);
  });

  // --- Theoretical Max Analysis ---
  console.log('\n🧠 THEORETICAL MAX (If players were never sold/benched):');
  
  const theoreticalQuery = `
    SELECT 
      u.name as user_name,
      p.name as player_name,
      SUM(prs.fantasy_points) as player_total_points
    FROM initial_squads isq
    JOIN users u ON isq.user_id = u.id
    JOIN players p ON isq.player_id = p.id
    JOIN player_round_stats prs ON isq.player_id = prs.player_id
    GROUP BY u.name, p.name
    ORDER BY u.name, player_total_points DESC
  `;
  
  const theoreticalRows = db.prepare(theoreticalQuery).all();
  
  // Group by User
  const theoryReport = {};
  theoreticalRows.forEach(row => {
    if (!theoryReport[row.user_name]) theoryReport[row.user_name] = [];
    theoryReport[row.user_name].push(row);
  });

  // Calculate totals and print
  const theoryLeaderboard = [];
  
  Object.entries(theoryReport).forEach(([user, players]) => {
      const totalPoints = players.reduce((sum, p) => sum + p.player_total_points, 0);
      theoryLeaderboard.push({ user, total: totalPoints, players });
  });
  
  theoryLeaderboard.sort((a, b) => b.total - a.total);

  theoryLeaderboard.forEach((entry, idx) => {
    // Calculate efficiency (Actual / Potential)
    const actualEntry = leaderboard.find(l => l.user === entry.user);
    const actual = actualEntry ? actualEntry.total : 0;
    const efficiency = entry.total > 0 ? ((actual / entry.total) * 100).toFixed(1) : "0.0";
    
    console.log(`\n${(idx + 1).toString().padStart(2)}. ${entry.user} | Potential: ${entry.total} pts (Efficiency: ${efficiency}%)`);
    console.log(`    --------------------------------------------------`);
    entry.players.forEach(p => {
        console.log(`    ⛹️  ${p.player_name.padEnd(25)}: ${p.player_total_points} pts`);
    });
    console.log(`    --------------------------------------------------`);
    console.log(`    TOTAL POTENTIAL: ${entry.total} pts`);
  });

    // --- Initial Squad Contribution Percentage ---
  console.log('\n📈 INITIAL SQUAD CONTRIBUTION (% of Total User Points):');
  
  const userTotalsQuery = `
    SELECT 
      u.name as user_name,
      SUM(ur.points) as total_points
    FROM users u
    JOIN user_rounds ur ON u.id = ur.user_id
    WHERE ur.participated = 1
    GROUP BY u.name
    ORDER BY total_points DESC
  `;
  
  const userTotals = db.prepare(userTotalsQuery).all();
  
  const contributionReport = userTotals.map(userTotal => {
    const actualEntry = leaderboard.find(l => l.user === userTotal.user_name);
    const initialSquadPoints = actualEntry ? actualEntry.total : 0;
    const totalPoints = userTotal.total_points || 0;
    const percentage = totalPoints > 0 ? ((initialSquadPoints / totalPoints) * 100).toFixed(1) : "0.0";
    
    return {
      user: userTotal.user_name,
      initialSquadPoints: initialSquadPoints.toFixed(1),
      totalPoints,
      percentage
    };
  });
  
  contributionReport.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  
  console.log('\n    User                  | Initial Squad Pts | Total Pts | Contribution %');
  console.log('    ------------------------------------------------------------------');
  
  contributionReport.forEach((entry, idx) => {
    console.log(`${(idx + 1).toString().padStart(2)}. ${entry.user.padEnd(20)} | ${entry.initialSquadPoints.padStart(17)} | ${entry.totalPoints.toString().padStart(9)} | ${entry.percentage.padStart(12)}%`);
  });
}

analyzeInitialPicks();
