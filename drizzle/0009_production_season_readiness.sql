-- Reconcile constraints that exist in the Drizzle model but were not installed
-- when production was provisioned with schema push instead of migration replay.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_email_unique') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_rounds'::regclass AND conname='unique_user_round') THEN
    ALTER TABLE "user_rounds" ADD CONSTRAINT "unique_user_round" UNIQUE("season_id","user_id","round_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.fichajes'::regclass AND conname='unique_fichaje') THEN
    ALTER TABLE "fichajes" ADD CONSTRAINT "unique_fichaje" UNIQUE("season_id","timestamp","player_id","vendedor","comprador","precio");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.initial_squads'::regclass AND conname='unique_initial_squad') THEN
    ALTER TABLE "initial_squads" ADD CONSTRAINT "unique_initial_squad" UNIQUE("season_id","user_id","player_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.lineups'::regclass AND conname='unique_lineup') THEN
    ALTER TABLE "lineups" ADD CONSTRAINT "unique_lineup" UNIQUE("season_id","user_id","round_id","player_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.market_listings'::regclass AND conname='unique_market_listing') THEN
    ALTER TABLE "market_listings" ADD CONSTRAINT "unique_market_listing" UNIQUE("season_id","player_id","listed_at");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.market_values'::regclass AND conname='unique_player_date') THEN
    ALTER TABLE "market_values" ADD CONSTRAINT "unique_player_date" UNIQUE("season_id","player_id","date");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.matches'::regclass AND conname='unique_match') THEN
    ALTER TABLE "matches" ADD CONSTRAINT "unique_match" UNIQUE("season_id","round_id","home_id","away_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.matches'::regclass AND conname='unique_match_official_game') THEN
    ALTER TABLE "matches" ADD CONSTRAINT "unique_match_official_game" UNIQUE("season_id","official_game_code");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.player_round_stats'::regclass AND conname='unique_player_round_stat') THEN
    ALTER TABLE "player_round_stats" ADD CONSTRAINT "unique_player_round_stat" UNIQUE("season_id","player_id","round_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.porras'::regclass AND conname='unique_porra') THEN
    ALTER TABLE "porras" ADD CONSTRAINT "unique_porra" UNIQUE("season_id","user_id","round_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.tournaments'::regclass AND conname='unique_tournament') THEN
    ALTER TABLE "tournaments" ADD CONSTRAINT "unique_tournament" UNIQUE("season_id","id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.tournament_phases'::regclass AND conname='unique_tournament_phase') THEN
    ALTER TABLE "tournament_phases" ADD CONSTRAINT "unique_tournament_phase" UNIQUE("season_id","tournament_id","order_index");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.tournament_fixtures'::regclass AND conname='unique_tournament_fixture') THEN
    ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "unique_tournament_fixture" UNIQUE("season_id","tournament_id","id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.tournament_standings'::regclass AND conname='unique_tournament_standing') THEN
    ALTER TABLE "tournament_standings" ADD CONSTRAINT "unique_tournament_standing" UNIQUE("season_id","tournament_id","phase_name","group_name","user_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.hoopgrid_challenges'::regclass AND conname='hoopgrid_challenges_game_date_unique') THEN
    ALTER TABLE "hoopgrid_challenges" ADD CONSTRAINT "hoopgrid_challenges_game_date_unique" UNIQUE("game_date");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.hoopgrid_guesses'::regclass AND conname='unique_guess') THEN
    ALTER TABLE "hoopgrid_guesses" ADD CONSTRAINT "unique_guess" UNIQUE("challenge_id","user_id","cell_index");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.playoff_predictions'::regclass AND conname='unique_playoff_prediction') THEN
    ALTER TABLE "playoff_predictions" ADD CONSTRAINT "unique_playoff_prediction" UNIQUE("season_id","user_id","stage","match_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.playoff_results'::regclass AND conname='unique_playoff_result') THEN
    ALTER TABLE "playoff_results" ADD CONSTRAINT "unique_playoff_result" UNIQUE("season_id","match_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_playoff_media'::regclass AND conname='unique_user_playoff_media') THEN
    ALTER TABLE "user_playoff_media" ADD CONSTRAINT "unique_user_playoff_media" UNIQUE("season_id","user_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_player_mappings'::regclass AND conname='unique_official_player_mapping') THEN
    ALTER TABLE "official_player_mappings" ADD CONSTRAINT "unique_official_player_mapping" UNIQUE("season_id","provider","player_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_team_mappings'::regclass AND conname='unique_official_team_mapping') THEN
    ALTER TABLE "official_team_mappings" ADD CONSTRAINT "unique_official_team_mapping" UNIQUE("season_id","provider","team_id");
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.assistant_messages'::regclass AND conname='assistant_messages_conversation_id_assistant_conversations_id_fk') THEN
    ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.hoopgrid_guesses'::regclass AND conname='hoopgrid_guesses_challenge_id_hoopgrid_challenges_id_fk') THEN
    ALTER TABLE "hoopgrid_guesses" ADD CONSTRAINT "hoopgrid_guesses_challenge_id_hoopgrid_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "hoopgrid_challenges"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.hoopgrid_guesses'::regclass AND conname='hoopgrid_guesses_user_id_users_id_fk') THEN
    ALTER TABLE "hoopgrid_guesses" ADD CONSTRAINT "hoopgrid_guesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.hoopgrid_guesses'::regclass AND conname='hoopgrid_guesses_player_id_players_id_fk') THEN
    ALTER TABLE "hoopgrid_guesses" ADD CONSTRAINT "hoopgrid_guesses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.playoff_predictions'::regclass AND conname='playoff_predictions_user_id_users_id_fk') THEN
    ALTER TABLE "playoff_predictions" ADD CONSTRAINT "playoff_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.playoff_predictions'::regclass AND conname='playoff_predictions_predicted_winner_id_teams_id_fk') THEN
    ALTER TABLE "playoff_predictions" ADD CONSTRAINT "playoff_predictions_predicted_winner_id_teams_id_fk" FOREIGN KEY ("predicted_winner_id") REFERENCES "teams"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.playoff_results'::regclass AND conname='playoff_results_winner_id_teams_id_fk') THEN
    ALTER TABLE "playoff_results" ADD CONSTRAINT "playoff_results_winner_id_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "teams"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.tournament_fixtures'::regclass AND conname='tournament_fixtures_season_tournament_fk') THEN
    ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_season_tournament_fk" FOREIGN KEY ("season_id","tournament_id") REFERENCES "tournaments"("season_id","id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.tournament_phases'::regclass AND conname='tournament_phases_season_tournament_fk') THEN
    ALTER TABLE "tournament_phases" ADD CONSTRAINT "tournament_phases_season_tournament_fk" FOREIGN KEY ("season_id","tournament_id") REFERENCES "tournaments"("season_id","id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.tournament_standings'::regclass AND conname='tournament_standings_season_tournament_fk') THEN
    ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_season_tournament_fk" FOREIGN KEY ("season_id","tournament_id") REFERENCES "tournaments"("season_id","id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_playoff_media'::regclass AND conname='user_playoff_media_user_id_users_id_fk') THEN
    ALTER TABLE "user_playoff_media" ADD CONSTRAINT "user_playoff_media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_games'::regclass AND conname='official_games_season_id_seasons_id_fk') THEN
    ALTER TABLE "official_games" ADD CONSTRAINT "official_games_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_play_by_play'::regclass AND conname='official_play_by_play_season_id_seasons_id_fk') THEN
    ALTER TABLE "official_play_by_play" ADD CONSTRAINT "official_play_by_play_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_player_game_stats'::regclass AND conname='official_player_game_stats_season_id_seasons_id_fk') THEN
    ALTER TABLE "official_player_game_stats" ADD CONSTRAINT "official_player_game_stats_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_player_mappings'::regclass AND conname='official_player_mappings_season_id_seasons_id_fk') THEN
    ALTER TABLE "official_player_mappings" ADD CONSTRAINT "official_player_mappings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_player_mappings'::regclass AND conname='official_player_mappings_player_id_players_id_fk') THEN
    ALTER TABLE "official_player_mappings" ADD CONSTRAINT "official_player_mappings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_shots'::regclass AND conname='official_shots_season_id_seasons_id_fk') THEN
    ALTER TABLE "official_shots" ADD CONSTRAINT "official_shots_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_team_mappings'::regclass AND conname='official_team_mappings_season_id_seasons_id_fk') THEN
    ALTER TABLE "official_team_mappings" ADD CONSTRAINT "official_team_mappings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_team_mappings'::regclass AND conname='official_team_mappings_team_id_teams_id_fk') THEN
    ALTER TABLE "official_team_mappings" ADD CONSTRAINT "official_team_mappings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.official_team_standings'::regclass AND conname='official_team_standings_season_id_seasons_id_fk') THEN
    ALTER TABLE "official_team_standings" ADD CONSTRAINT "official_team_standings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_official_games_season_schedule" ON "official_games" ("season_id","scheduled_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_official_play_by_play_game" ON "official_play_by_play" ("season_id","game_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_official_player_game_stats_game" ON "official_player_game_stats" ("season_id","game_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_official_shots_game" ON "official_shots" ("season_id","game_code");
--> statement-breakpoint
ALTER TABLE "official_games" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_team_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_player_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_player_game_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_play_by_play" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_shots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_team_standings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL PRIVILEGES ON TABLE "official_games" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON TABLE "official_team_mappings" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON TABLE "official_player_mappings" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON TABLE "official_player_game_stats" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON TABLE "official_play_by_play" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON TABLE "official_shots" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON TABLE "official_team_standings" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON SEQUENCE "official_games_id_seq" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON SEQUENCE "official_team_mappings_id_seq" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON SEQUENCE "official_player_mappings_id_seq" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON SEQUENCE "official_player_game_stats_id_seq" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON SEQUENCE "official_play_by_play_id_seq" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON SEQUENCE "official_shots_id_seq" FROM anon, authenticated;
    REVOKE ALL PRIVILEGES ON SEQUENCE "official_team_standings_id_seq" FROM anon, authenticated;
  END IF;
END $$;
