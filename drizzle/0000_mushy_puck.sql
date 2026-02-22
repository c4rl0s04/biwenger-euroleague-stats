CREATE TABLE "fichajes" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" bigint,
	"fecha" text,
	"player_id" integer,
	"precio" integer,
	"vendedor" text,
	"comprador" text
);
--> statement-breakpoint
CREATE TABLE "finances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"round_id" integer,
	"date" text,
	"type" text,
	"amount" integer,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "initial_squads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"player_id" integer,
	"price" integer
);
--> statement-breakpoint
CREATE TABLE "lineups" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"round_id" integer,
	"round_name" text,
	"player_id" integer,
	"is_captain" boolean,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "market_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"price" integer,
	"date" date,
	CONSTRAINT "unique_player_date" UNIQUE("player_id","date")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer,
	"round_name" text,
	"home_id" integer,
	"away_id" integer,
	"date" timestamp,
	"status" text,
	"home_score" integer,
	"away_score" integer,
	"home_score_regtime" integer,
	"away_score_regtime" integer,
	"home_q1" integer,
	"away_q1" integer,
	"home_q2" integer,
	"away_q2" integer,
	"home_q3" integer,
	"away_q3" integer,
	"home_q4" integer,
	"away_q4" integer,
	"home_ot" integer,
	"away_ot" integer,
	CONSTRAINT "unique_match" UNIQUE("round_id","home_id","away_id")
);
--> statement-breakpoint
CREATE TABLE "player_mappings" (
	"biwenger_id" integer PRIMARY KEY NOT NULL,
	"euroleague_code" text NOT NULL,
	"details_json" text
);
--> statement-breakpoint
CREATE TABLE "player_round_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"round_id" integer,
	"fantasy_points" integer,
	"minutes" integer,
	"points" integer,
	"two_points_made" integer,
	"two_points_attempted" integer,
	"three_points_made" integer,
	"three_points_attempted" integer,
	"free_throws_made" integer,
	"free_throws_attempted" integer,
	"rebounds" integer,
	"assists" integer,
	"steals" integer,
	"blocks" integer,
	"turnovers" integer,
	"fouls_committed" integer,
	"valuation" integer
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"position" text,
	"puntos" integer,
	"partidos_jugados" integer,
	"played_home" integer,
	"played_away" integer,
	"points_home" integer,
	"points_away" integer,
	"points_last_season" integer,
	"owner_id" text,
	"status" text,
	"price_increment" integer,
	"birth_date" text,
	"height" integer,
	"weight" integer,
	"price" integer,
	"euroleague_code" text,
	"dorsal" text,
	"country" text,
	"team_id" integer,
	"img" text
);
--> statement-breakpoint
CREATE TABLE "porras" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"round_id" integer,
	"round_name" text,
	"result" text,
	"aciertos" integer
);
--> statement-breakpoint
CREATE TABLE "sync_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"short_name" text,
	"code" text,
	"img" text
);
--> statement-breakpoint
CREATE TABLE "tournament_fixtures" (
	"id" integer PRIMARY KEY NOT NULL,
	"tournament_id" integer,
	"phase_id" integer,
	"round_name" text,
	"round_id" integer,
	"group_name" text,
	"home_user_id" text,
	"away_user_id" text,
	"home_score" integer,
	"away_score" integer,
	"date" integer,
	"status" text
);
--> statement-breakpoint
CREATE TABLE "tournament_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer,
	"name" text,
	"type" text,
	"order_index" integer
);
--> statement-breakpoint
CREATE TABLE "tournament_standings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer,
	"phase_name" text,
	"group_name" text,
	"user_id" text,
	"position" integer,
	"points" integer,
	"won" integer,
	"lost" integer,
	"drawn" integer,
	"scored" integer,
	"against" integer
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" integer PRIMARY KEY NOT NULL,
	"league_id" integer,
	"name" text,
	"type" text,
	"status" text,
	"data_json" text,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "transfer_bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"transfer_id" integer,
	"bidder_id" text,
	"bidder_name" text,
	"amount" integer
);
--> statement-breakpoint
CREATE TABLE "user_rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"round_id" integer,
	"round_name" text,
	"points" integer,
	"participated" boolean DEFAULT true,
	"alineacion" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"icon" text,
	"color_index" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_phase_id_tournament_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."tournament_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_phases" ADD CONSTRAINT "tournament_phases_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_bids" ADD CONSTRAINT "transfer_bids_transfer_id_fichajes_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."fichajes"("id") ON DELETE no action ON UPDATE no action;