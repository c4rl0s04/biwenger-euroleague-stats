ALTER TABLE "assistant_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assistant_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fichajes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "finances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hoopgrid_challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hoopgrid_guesses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "initial_squads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lineups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "market_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "market_values" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_play_by_play" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_player_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_shots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_team_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_team_standings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "player_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "player_round_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "player_seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playoff_predictions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playoff_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "porras" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_meta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournament_fixtures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournament_phases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournament_standings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournaments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transfer_bids" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_biwenger_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_playoff_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE
  "assistant_conversations",
  "assistant_messages",
  "fichajes",
  "finances",
  "hoopgrid_challenges",
  "hoopgrid_guesses",
  "initial_squads",
  "lineups",
  "market_listings",
  "market_values",
  "matches",
  "official_play_by_play",
  "official_player_mappings",
  "official_shots",
  "official_team_mappings",
  "official_team_standings",
  "player_mappings",
  "player_round_stats",
  "player_seasons",
  "players",
  "playoff_predictions",
  "playoff_results",
  "porras",
  "seasons",
  "sync_meta",
  "team_seasons",
  "teams",
  "tournament_fixtures",
  "tournament_phases",
  "tournament_standings",
  "tournaments",
  "transfer_bids",
  "user_biwenger_credentials",
  "user_playoff_media",
  "user_rounds",
  "user_seasons",
  "users"
FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON SEQUENCE
  "fichajes_id_seq",
  "finances_id_seq",
  "initial_squads_id_seq",
  "lineups_id_seq",
  "market_listings_id_seq",
  "market_values_id_seq",
  "matches_id_seq",
  "official_play_by_play_id_seq",
  "official_player_mappings_id_seq",
  "official_shots_id_seq",
  "official_team_mappings_id_seq",
  "official_team_standings_id_seq",
  "player_round_stats_id_seq",
  "player_seasons_id_seq",
  "playoff_predictions_id_seq",
  "playoff_results_id_seq",
  "porras_id_seq",
  "team_seasons_id_seq",
  "tournament_fixtures_internal_id_seq",
  "tournament_phases_id_seq",
  "tournament_standings_id_seq",
  "tournaments_internal_id_seq",
  "transfer_bids_id_seq",
  "user_playoff_media_id_seq",
  "user_rounds_id_seq"
FROM PUBLIC;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE
  target_role text;
  has_postgres boolean;
BEGIN
  has_postgres := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres');

  IF has_postgres THEN
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
  END IF;

  FOR target_role IN SELECT unnest(ARRAY['anon', 'authenticated', 'service_role'])
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
      EXECUTE format('
        REVOKE ALL PRIVILEGES ON TABLE
          "assistant_conversations",
          "assistant_messages",
          "fichajes",
          "finances",
          "hoopgrid_challenges",
          "hoopgrid_guesses",
          "initial_squads",
          "lineups",
          "market_listings",
          "market_values",
          "matches",
          "official_play_by_play",
          "official_player_mappings",
          "official_shots",
          "official_team_mappings",
          "official_team_standings",
          "player_mappings",
          "player_round_stats",
          "player_seasons",
          "players",
          "playoff_predictions",
          "playoff_results",
          "porras",
          "seasons",
          "sync_meta",
          "team_seasons",
          "teams",
          "tournament_fixtures",
          "tournament_phases",
          "tournament_standings",
          "tournaments",
          "transfer_bids",
          "user_biwenger_credentials",
          "user_playoff_media",
          "user_rounds",
          "user_seasons",
          "users"
        FROM %I', target_role);

      EXECUTE format('
        REVOKE ALL PRIVILEGES ON SEQUENCE
          "fichajes_id_seq",
          "finances_id_seq",
          "initial_squads_id_seq",
          "lineups_id_seq",
          "market_listings_id_seq",
          "market_values_id_seq",
          "matches_id_seq",
          "official_play_by_play_id_seq",
          "official_player_mappings_id_seq",
          "official_shots_id_seq",
          "official_team_mappings_id_seq",
          "official_team_standings_id_seq",
          "player_round_stats_id_seq",
          "player_seasons_id_seq",
          "playoff_predictions_id_seq",
          "playoff_results_id_seq",
          "porras_id_seq",
          "team_seasons_id_seq",
          "tournament_fixtures_internal_id_seq",
          "tournament_phases_id_seq",
          "tournament_standings_id_seq",
          "tournaments_internal_id_seq",
          "transfer_bids_id_seq",
          "user_playoff_media_id_seq",
          "user_rounds_id_seq"
        FROM %I', target_role);

      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', target_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', target_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM %I', target_role);

      IF has_postgres THEN
        EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM %I', target_role);
        EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', target_role);
        EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON ROUTINES FROM %I', target_role);
      END IF;
    END IF;
  END LOOP;
END $$;
