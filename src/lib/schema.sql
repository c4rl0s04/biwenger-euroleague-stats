CREATE TABLE porras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                round_id INTEGER,
                round_name TEXT,
                result TEXT,
                aciertos INTEGER,
                UNIQUE(user_id, round_id)
            );

CREATE TABLE users (
                id TEXT PRIMARY KEY,
                name TEXT,
                icon TEXT
            );

CREATE TABLE user_rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                round_id INTEGER,
                round_name TEXT,
                points INTEGER,
                participated BOOLEAN DEFAULT 1,
                alineacion TEXT,
                UNIQUE(user_id, round_id)
            );

CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    position TEXT,
    team TEXT,
    puntos INTEGER,
    partidos_jugados INTEGER,
    played_home INTEGER,
    played_away INTEGER,
    points_home INTEGER,
    points_away INTEGER,
    points_last_season INTEGER,
    owner_id TEXT,
    status TEXT,
    price_increment INTEGER,
    -- NUEVAS COLUMNAS:
    birth_date TEXT,
    height INTEGER,
    weight INTEGER
);





CREATE TABLE lineups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                round_id INTEGER,
                round_name TEXT,
                player_id INTEGER,
                is_captain BOOLEAN,
                role TEXT,
                UNIQUE(user_id, round_id, player_id),
                FOREIGN KEY(player_id) REFERENCES players(id)
            );

CREATE TABLE matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                round_id INTEGER,
                round_name TEXT,
                home_team TEXT,
                away_team TEXT,
                date DATE,
                status TEXT,
                home_score INTEGER,
                away_score INTEGER,
                UNIQUE(round_id, home_team, away_team)
            );

CREATE TABLE fichajes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER,
                fecha TEXT,
                player_id INTEGER,
                precio INTEGER,
                vendedor TEXT,
                comprador TEXT,
                UNIQUE(timestamp, player_id, vendedor, comprador, precio),
                FOREIGN KEY(player_id) REFERENCES players(id)
            );

CREATE TABLE transfer_bids (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transfer_id INTEGER,
                bidder_id TEXT,
                bidder_name TEXT,
                amount INTEGER,
                FOREIGN KEY(transfer_id) REFERENCES fichajes(id) ON DELETE CASCADE
            );



CREATE TABLE market_values (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                price INTEGER,
                date DATE,
                FOREIGN KEY(player_id) REFERENCES players(id)
            );

CREATE TABLE player_round_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                round_id INTEGER,
                fantasy_points INTEGER,
                minutes INTEGER,
                points INTEGER,
                two_points_made INTEGER,
                two_points_attempted INTEGER,
                three_points_made INTEGER,
                three_points_attempted INTEGER,
                free_throws_made INTEGER,
                free_throws_attempted INTEGER,
                rebounds INTEGER,
                assists INTEGER,
                steals INTEGER,
                blocks INTEGER,
                turnovers INTEGER,
                fouls_committed INTEGER,
                UNIQUE(player_id, round_id),
                FOREIGN KEY(player_id) REFERENCES players(id)
            );

