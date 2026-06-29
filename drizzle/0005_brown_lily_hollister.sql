CREATE TABLE "player_seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text DEFAULT '2025-26' NOT NULL,
	"player_id" integer NOT NULL,
	"team_id" integer,
	"owner_id" text,
	"puntos" integer,
	"partidos_jugados" integer,
	"played_home" integer,
	"played_away" integer,
	"points_home" integer,
	"points_away" integer,
	"points_last_season" integer,
	"status" text,
	"price_increment" integer,
	"price" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_player_season" UNIQUE("season_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"starts_at" date,
	"ends_at" date,
	"frozen_at" timestamp,
	"source_league_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_status_check" CHECK ("status" IN ('active', 'frozen', 'archived'));--> statement-breakpoint
INSERT INTO "seasons" (
	"id",
	"name",
	"status",
	"starts_at",
	"ends_at",
	"frozen_at",
	"notes"
) VALUES (
	'2025-26',
	'EuroLeague Fantasy 2025-26',
	'frozen',
	NULL,
	NULL,
	now(),
	'Canonical frozen snapshot created from the repaired production database.'
) ON CONFLICT ("id") DO UPDATE SET
	"name" = EXCLUDED."name",
	"status" = 'frozen',
	"frozen_at" = COALESCE("seasons"."frozen_at", EXCLUDED."frozen_at"),
	"notes" = COALESCE("seasons"."notes", EXCLUDED."notes"),
	"updated_at" = now();
--> statement-breakpoint
CREATE TABLE "user_seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text DEFAULT '2025-26' NOT NULL,
	"user_id" text NOT NULL,
	"name" text,
	"icon" text,
	"color_index" integer DEFAULT 0,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_season" UNIQUE("season_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "fichajes" DROP CONSTRAINT IF EXISTS "unique_fichaje";--> statement-breakpoint
ALTER TABLE "initial_squads" DROP CONSTRAINT IF EXISTS "unique_initial_squad";--> statement-breakpoint
ALTER TABLE "lineups" DROP CONSTRAINT IF EXISTS "unique_lineup";--> statement-breakpoint
ALTER TABLE "market_listings" DROP CONSTRAINT IF EXISTS "unique_market_listing";--> statement-breakpoint
ALTER TABLE "market_values" DROP CONSTRAINT IF EXISTS "unique_player_date";--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "unique_match";--> statement-breakpoint
ALTER TABLE "player_round_stats" DROP CONSTRAINT IF EXISTS "unique_player_round_stat";--> statement-breakpoint
ALTER TABLE "playoff_predictions" DROP CONSTRAINT IF EXISTS "unique_playoff_prediction";--> statement-breakpoint
ALTER TABLE "porras" DROP CONSTRAINT IF EXISTS "unique_porra";--> statement-breakpoint
ALTER TABLE "tournament_fixtures" DROP CONSTRAINT IF EXISTS "unique_tournament_fixture";--> statement-breakpoint
ALTER TABLE "tournament_phases" DROP CONSTRAINT IF EXISTS "unique_tournament_phase";--> statement-breakpoint
ALTER TABLE "tournament_standings" DROP CONSTRAINT IF EXISTS "unique_tournament_standing";--> statement-breakpoint
ALTER TABLE "user_rounds" DROP CONSTRAINT IF EXISTS "unique_user_round";--> statement-breakpoint
ALTER TABLE "playoff_results" DROP CONSTRAINT IF EXISTS "playoff_results_pkey";--> statement-breakpoint
ALTER TABLE "playoff_results" ALTER COLUMN "match_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_playoff_media" DROP CONSTRAINT IF EXISTS "user_playoff_media_pkey";--> statement-breakpoint
ALTER TABLE "user_playoff_media" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fichajes" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "finances" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "initial_squads" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "lineups" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "market_listings" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "market_values" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "playoff_predictions" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "playoff_results" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "playoff_results" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "porras" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_phases" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer_bids" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_playoff_media" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "user_playoff_media" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_rounds" ADD COLUMN "season_id" text DEFAULT '2025-26' NOT NULL;--> statement-breakpoint
ALTER TABLE "player_seasons" ADD CONSTRAINT "player_seasons_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_seasons" ADD CONSTRAINT "player_seasons_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_seasons" ADD CONSTRAINT "user_seasons_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_seasons" ADD CONSTRAINT "user_seasons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "user_seasons" (
	"season_id",
	"user_id",
	"name",
	"icon",
	"color_index",
	"status"
)
SELECT
	'2025-26',
	"id",
	"name",
	"icon",
	"color_index",
	'active'
FROM "users"
ON CONFLICT ("season_id", "user_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "player_seasons" (
	"season_id",
	"player_id",
	"team_id",
	"owner_id",
	"puntos",
	"partidos_jugados",
	"played_home",
	"played_away",
	"points_home",
	"points_away",
	"points_last_season",
	"status",
	"price_increment",
	"price"
)
SELECT
	'2025-26',
	"id",
	"team_id",
	"owner_id",
	"puntos",
	"partidos_jugados",
	"played_home",
	"played_away",
	"points_home",
	"points_away",
	"points_last_season",
	"status",
	"price_increment",
	"price"
FROM "players"
ON CONFLICT ("season_id", "player_id") DO UPDATE SET
	"team_id" = EXCLUDED."team_id",
	"owner_id" = EXCLUDED."owner_id",
	"puntos" = EXCLUDED."puntos",
	"partidos_jugados" = EXCLUDED."partidos_jugados",
	"played_home" = EXCLUDED."played_home",
	"played_away" = EXCLUDED."played_away",
	"points_home" = EXCLUDED."points_home",
	"points_away" = EXCLUDED."points_away",
	"points_last_season" = EXCLUDED."points_last_season",
	"status" = EXCLUDED."status",
	"price_increment" = EXCLUDED."price_increment",
	"price" = EXCLUDED."price",
	"updated_at" = now();
--> statement-breakpoint
CREATE INDEX "idx_player_seasons_season_owner" ON "player_seasons" USING btree ("season_id","owner_id");--> statement-breakpoint
CREATE INDEX "idx_player_seasons_season_team" ON "player_seasons" USING btree ("season_id","team_id");--> statement-breakpoint
CREATE INDEX "idx_seasons_status" ON "seasons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_seasons_season_user" ON "user_seasons" USING btree ("season_id","user_id");--> statement-breakpoint
ALTER TABLE "fichajes" ADD CONSTRAINT "fichajes_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finances" ADD CONSTRAINT "finances_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initial_squads" ADD CONSTRAINT "initial_squads_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_values" ADD CONSTRAINT "market_values_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD CONSTRAINT "player_round_stats_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_predictions" ADD CONSTRAINT "playoff_predictions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_results" ADD CONSTRAINT "playoff_results_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "porras" ADD CONSTRAINT "porras_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_phases" ADD CONSTRAINT "tournament_phases_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_bids" ADD CONSTRAINT "transfer_bids_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_playoff_media" ADD CONSTRAINT "user_playoff_media_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rounds" ADD CONSTRAINT "user_rounds_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fichajes_season_timestamp" ON "fichajes" USING btree ("season_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_lineups_season_round" ON "lineups" USING btree ("season_id","round_id");--> statement-breakpoint
CREATE INDEX "idx_market_values_season_date" ON "market_values" USING btree ("season_id","date");--> statement-breakpoint
CREATE INDEX "idx_matches_season_round" ON "matches" USING btree ("season_id","round_id");--> statement-breakpoint
CREATE INDEX "idx_player_round_stats_season_round" ON "player_round_stats" USING btree ("season_id","round_id");--> statement-breakpoint
CREATE INDEX "idx_user_rounds_season_round" ON "user_rounds" USING btree ("season_id","round_id");--> statement-breakpoint
ALTER TABLE "fichajes" ADD CONSTRAINT "unique_fichaje" UNIQUE("season_id","timestamp","player_id","vendedor","comprador","precio");--> statement-breakpoint
ALTER TABLE "initial_squads" ADD CONSTRAINT "unique_initial_squad" UNIQUE("season_id","user_id","player_id");--> statement-breakpoint
ALTER TABLE "lineups" ADD CONSTRAINT "unique_lineup" UNIQUE("season_id","user_id","round_id","player_id");--> statement-breakpoint
ALTER TABLE "market_listings" ADD CONSTRAINT "unique_market_listing" UNIQUE("season_id","player_id","listed_at");--> statement-breakpoint
ALTER TABLE "market_values" ADD CONSTRAINT "unique_player_date" UNIQUE("season_id","player_id","date");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "unique_match" UNIQUE("season_id","round_id","home_id","away_id");--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD CONSTRAINT "unique_player_round_stat" UNIQUE("season_id","player_id","round_id");--> statement-breakpoint
ALTER TABLE "playoff_predictions" ADD CONSTRAINT "unique_playoff_prediction" UNIQUE("season_id","user_id","stage","match_id");--> statement-breakpoint
ALTER TABLE "playoff_results" ADD CONSTRAINT "unique_playoff_result" UNIQUE("season_id","match_id");--> statement-breakpoint
ALTER TABLE "porras" ADD CONSTRAINT "unique_porra" UNIQUE("season_id","user_id","round_id");--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "unique_tournament_fixture" UNIQUE("season_id","tournament_id","id");--> statement-breakpoint
ALTER TABLE "tournament_phases" ADD CONSTRAINT "unique_tournament_phase" UNIQUE("season_id","tournament_id","order_index");--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "unique_tournament_standing" UNIQUE("season_id","tournament_id","phase_name","group_name","user_id");--> statement-breakpoint
ALTER TABLE "user_playoff_media" ADD CONSTRAINT "unique_user_playoff_media" UNIQUE("season_id","user_id");--> statement-breakpoint
ALTER TABLE "user_rounds" ADD CONSTRAINT "unique_user_round" UNIQUE("season_id","user_id","round_id");
