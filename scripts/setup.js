#!/usr/bin/env node

/**
 * Interactive Setup Wizard for Biwenger Stats
 * Guides users through credential collection and generates .env file
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  print(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function printStep(step, total, title) {
  print(`\n📋 Step ${step}/${total}: ${title}`, 'cyan');
  console.log('-'.repeat(60));
}

async function validateToken(token) {
  if (!token || token.length < 20) {
    print('⚠️  Token seems too short. Please check and try again.', 'yellow');
    return false;
  }
  return true;
}

async function validateNumericId(id, name) {
  if (!id || !/^\d+$/.test(id)) {
    print(`⚠️  ${name} must be a number. Please try again.`, 'yellow');
    return false;
  }
  return true;
}

async function main() {
  console.clear();

  printHeader('🏀 Biwenger Stats - Setup Wizard');
  print('Welcome! This wizard will help you configure your environment.', 'green');
  print("You'll need to have Biwenger open in your browser.\n", 'green');

  const config = {};

  // Step 1: BIWENGER_TOKEN
  printStep(1, 5, 'Get your Biwenger Token');
  print('1. Open https://biwenger.as.com in your browser');
  print('2. Press F12 to open Developer Tools');
  print('3. Go to the "Network" tab');
  print('4. Refresh the page (F5 or Cmd+R)');
  print('5. Look for a request to "https://biwenger.as.com/api/v2/"');
  print('6. Click it, go to "Headers", find "Authorization: Bearer <TOKEN>"');
  print('7. Copy everything AFTER "Bearer " (the long string)\n');

  let tokenValid = false;
  while (!tokenValid) {
    config.BIWENGER_TOKEN = await ask('? Paste your BIWENGER_TOKEN: ');
    tokenValid = await validateToken(config.BIWENGER_TOKEN);
  }
  print('✓ Token saved!', 'green');

  // Step 2: Fetch leagues and let user select
  printStep(2, 3, 'Select Your League');
  print('Fetching your leagues...\n');

  try {
    const response = await fetch('https://biwenger.as.com/api/v2/account', {
      headers: {
        Authorization: `Bearer ${config.BIWENGER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    const leagues = data?.data?.leagues || [];

    if (leagues.length === 0) {
      throw new Error('No leagues found in your account');
    }

    print(`Found ${leagues.length} league(s):\n`, 'green');

    // Display league options
    leagues.forEach((league, index) => {
      print(`${index + 1}. ${league.name} (${league.competition})`, 'cyan');
      print(`   User: ${league.user?.name || 'N/A'} | Position: ${league.user?.position || 'N/A'}`);
      console.log('');
    });

    // Get user selection
    let selectedLeague = null;
    while (!selectedLeague) {
      const choice = await ask(`\n? Select a league (1-${leagues.length}): `);
      const selectedIndex = parseInt(choice) - 1;

      if (selectedIndex >= 0 && selectedIndex < leagues.length) {
        selectedLeague = leagues[selectedIndex];
      } else {
        print('⚠️  Invalid selection. Please try again.', 'yellow');
      }
    }

    // Extract IDs from selected league
    config.BIWENGER_LEAGUE_ID = String(selectedLeague.id);
    config.BIWENGER_USER_ID = String(selectedLeague.user?.id);

    print(`\n✓ League selected: ${selectedLeague.name}`, 'green');
    print(`✓ League ID: ${config.BIWENGER_LEAGUE_ID}`, 'green');
    print(`✓ User ID: ${config.BIWENGER_USER_ID}`, 'green');
  } catch (error) {
    print(`⚠️  Auto-detection failed: ${error.message}`, 'yellow');
    print('Please enter your IDs manually.\n', 'yellow');

    // Fallback to manual entry
    printStep(2, 5, 'Get your League ID (Manual)');
    print('1. In Developer Tools (Network tab), find a request to "/api/v2/league"');
    print('2. Click it and go to the "Response" or "Preview" tab');
    print('3. Find the "id" field in the JSON (it\'s a number)');
    print('4. Copy that number\n');

    let leagueIdValid = false;
    while (!leagueIdValid) {
      config.BIWENGER_LEAGUE_ID = await ask('? Paste your BIWENGER_LEAGUE_ID: ');
      leagueIdValid = await validateNumericId(config.BIWENGER_LEAGUE_ID, 'League ID');
    }
    print('✓ League ID saved!', 'green');

    printStep(3, 5, 'Get your User ID (Manual)');
    print('1. In Developer Tools (Network tab), find a request to "/api/v2/user"');
    print('2. Click it and go to the "Response" or "Preview" tab');
    print('3. Find the "id" field in the JSON (it\'s a number)');
    print('4. Copy that number\n');

    let userIdValid = false;
    while (!userIdValid) {
      config.BIWENGER_USER_ID = await ask('? Paste your BIWENGER_USER_ID: ');
      userIdValid = await validateNumericId(config.BIWENGER_USER_ID, 'User ID');
    }
    print('✓ User ID saved!', 'green');
  }

  // Step 3: ACCESS_PASSWORD
  printStep(3, 3, 'Set Admin Password');
  print('Choose a password to protect the admin/sync dashboard.\n');

  config.ACCESS_PASSWORD = await ask('? Enter your ACCESS_PASSWORD: ');
  print('✓ Password saved!', 'green');

  // Auto-generate AUTH_SECRET
  print('\n🔐 Generating Auth Secret', 'cyan');
  console.log('-'.repeat(60));
  print('Generating a secure random string for session encryption...\n');

  config.AUTH_SECRET = crypto.randomBytes(32).toString('base64');
  print('✓ Auth secret generated automatically!', 'green');

  // Optional: Database
  print('\n📦 Database Configuration', 'cyan');
  console.log('-'.repeat(60));
  print('By default, Docker will create a local PostgreSQL database.');
  print('If you want to use Supabase or another remote database, enter the URL now.');
  print('Otherwise, just press Enter to skip.\n');

  const dbUrl = await ask('? DATABASE_URL (optional): ');
  if (dbUrl && dbUrl.trim()) {
    config.DATABASE_URL = dbUrl.trim();
    print('✓ Remote database URL saved!', 'green');
  } else {
    print('✓ Using local Docker database (default)', 'green');
  }

  // Write .env file
  printHeader('💾 Writing Configuration');

  const envPath = path.join(__dirname, '..', '.env');
  const envContent = `# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# OPTION 1: Local Postgres (Docker) - Default
# To use Local, keep these uncommented and DATABASE_URL commented out.
POSTGRES_HOST=localhost
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=biwenger
POSTGRES_PORT=5432

${config.DATABASE_URL ? `# OPTION 2: Supabase / Remote Postgres\n# This takes precedence over the individual variables above if set.\nDATABASE_URL="${config.DATABASE_URL}"\n` : '# OPTION 2: Supabase / Remote Postgres\n# To use Supabase, uncomment DATABASE_URL and comment out the Local variables above.\n# DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB]"\n'}
# ==========================================
# BIWENGER API CREDENTIALS
# ==========================================
# Obtain your token by logging into Biwenger Web and checking LocalStorage or network requests
BIWENGER_TOKEN=${config.BIWENGER_TOKEN}
BIWENGER_LEAGUE_ID=${config.BIWENGER_LEAGUE_ID}
BIWENGER_USER_ID=${config.BIWENGER_USER_ID}

# ==========================================
# APPLICATION AUTH
# ==========================================
# Password to access the admin/sync dashboard
ACCESS_PASSWORD="${config.ACCESS_PASSWORD}"
# Random string for session encryption (generate with \`openssl rand -base64 32\`)
AUTH_SECRET="${config.AUTH_SECRET}"

# ==========================================
# EUROLEAGUE CONFIG
# ==========================================
EUROLEAGUE_SEASON_CODE=E2025
LEAGUE_START_DATE=2025-09-25
`;

  fs.writeFileSync(envPath, envContent);
  print(`✓ Configuration saved to ${envPath}`, 'green');

  // Final instructions
  printHeader('🎉 Setup Complete!');
  print('Your .env file has been created successfully.\n', 'green');
  print('Next steps:', 'bright');
  print('1. Run: docker-compose up -d --build');
  print('2. Wait for the initial sync to complete (~5-10 minutes)');
  print('3. Open http://localhost:3000 in your browser\n');
  print('Happy analyzing! 🏀', 'cyan');

  rl.close();
}

main().catch((error) => {
  console.error('Error during setup:', error);
  rl.close();
  process.exit(1);
});
