CREATE TABLE porras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                jornada TEXT,
                usuario TEXT,
                aciertos INTEGER,
                UNIQUE(jornada, usuario)
            );

CREATE TABLE users (
                id TEXT PRIMARY KEY,
                name TEXT
            );

CREATE TABLE user_rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                round_name TEXT,
                points INTEGER, participated BOOLEAN DEFAULT 1,
                UNIQUE(user_id, round_name)
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
    points_last_season INTEGER);





CREATE TABLE lineups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                round_id INTEGER,
                round_name TEXT,
                player_id INTEGER,
                is_captain BOOLEAN,
                points INTEGER,
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



CREATE TABLE market_values (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                price INTEGER,
                date DATE,
                UNIQUE(player_id, date),
                FOREIGN KEY(player_id) REFERENCES players(id)
            );

