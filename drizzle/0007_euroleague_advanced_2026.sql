CREATE TABLE "official_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"provider" text DEFAULT 'euroleague_advanced' NOT NULL,
	"game_code" integer NOT NULL,
	"game_id" text NOT NULL,
	"round_number" integer,
	"round_code" text,
	"phase" text,
	"home_team_code" text NOT NULL,
	"away_team_code" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"is_date_confirmed" boolean DEFAULT false,
	"is_time_confirmed" boolean DEFAULT false,
	"is_played" boolean DEFAULT false,
	"is_live" boolean DEFAULT false,
	"status" text DEFAULT 'scheduled' NOT NULL,
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
	"arena_code" text,
	"arena_name" text,
	"arena_capacity" integer,
	"home_coach" text,
	"away_coach" text,
	"referee_1" text,
	"referee_2" text,
	"referee_3" text,
	"payload_checksum" text,
	"raw_report" jsonb,
	"raw_metadata" jsonb,
	"finalized_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_official_game" UNIQUE("season_id","provider","game_code"),
	CONSTRAINT "unique_official_game_id" UNIQUE("season_id","provider","game_id")
);
--> statement-breakpoint
CREATE TABLE "official_play_by_play" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"game_code" integer NOT NULL,
	"sequence" integer NOT NULL,
	"provider_play_number" integer,
	"period" integer,
	"minute" integer,
	"marker_time" text,
	"play_type" text,
	"team_code" text,
	"provider_player_code" text,
	"player_name" text,
	"team_name" text,
	"dorsal" text,
	"home_score" integer,
	"away_score" integer,
	"comment" text,
	"play_info" text,
	"raw_payload" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_official_play" UNIQUE("season_id","game_code","sequence")
);
--> statement-breakpoint
CREATE TABLE "official_player_game_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"game_code" integer NOT NULL,
	"provider_player_code" text NOT NULL,
	"provider_name" text NOT NULL,
	"team_code" text NOT NULL,
	"is_home" boolean,
	"is_starter" boolean,
	"is_playing" boolean,
	"dorsal" text,
	"minutes" text,
	"minutes_seconds" integer,
	"points" integer,
	"two_points_made" integer,
	"two_points_attempted" integer,
	"three_points_made" integer,
	"three_points_attempted" integer,
	"free_throws_made" integer,
	"free_throws_attempted" integer,
	"offensive_rebounds" integer,
	"defensive_rebounds" integer,
	"total_rebounds" integer,
	"assists" integer,
	"steals" integer,
	"turnovers" integer,
	"blocks" integer,
	"blocks_against" integer,
	"fouls_committed" integer,
	"fouls_received" integer,
	"valuation" integer,
	"plus_minus" integer,
	"raw_payload" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_official_player_game_stat" UNIQUE("season_id","game_code","provider_player_code")
);
--> statement-breakpoint
CREATE TABLE "official_player_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"player_id" integer,
	"provider" text DEFAULT 'euroleague_advanced' NOT NULL,
	"provider_player_code" text NOT NULL,
	"provider_name" text NOT NULL,
	"provider_team_code" text,
	"image_url" text,
	"age" integer,
	"match_method" text NOT NULL,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'review_required' NOT NULL,
	"raw_payload" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_official_player_code" UNIQUE("season_id","provider","provider_player_code"),
	CONSTRAINT "unique_official_player_mapping" UNIQUE("season_id","provider","player_id")
);
--> statement-breakpoint
CREATE TABLE "official_shots" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"game_code" integer NOT NULL,
	"annotation_number" integer NOT NULL,
	"team_code" text,
	"provider_player_code" text,
	"player_name" text,
	"action_id" text,
	"action" text,
	"points" integer,
	"coordinate_x" integer,
	"coordinate_y" integer,
	"zone" text,
	"is_fastbreak" boolean,
	"is_second_chance" boolean,
	"is_points_off_turnover" boolean,
	"minute" integer,
	"marker_time" text,
	"home_score" integer,
	"away_score" integer,
	"occurred_at" timestamp with time zone,
	"raw_payload" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_official_shot" UNIQUE("season_id","game_code","annotation_number")
);
--> statement-breakpoint
CREATE TABLE "official_team_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"team_id" integer NOT NULL,
	"provider" text DEFAULT 'euroleague_advanced' NOT NULL,
	"provider_team_code" text NOT NULL,
	"provider_name" text NOT NULL,
	"crest_url" text,
	"match_method" text NOT NULL,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"raw_payload" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_official_team_mapping" UNIQUE("season_id","provider","team_id"),
	CONSTRAINT "unique_official_team_code" UNIQUE("season_id","provider","provider_team_code")
);
--> statement-breakpoint
CREATE TABLE "official_team_standings" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"team_code" text NOT NULL,
	"position" integer,
	"games_played" integer,
	"games_won" integer,
	"games_lost" integer,
	"points_for" integer,
	"points_against" integer,
	"raw_payload" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_official_team_standing" UNIQUE("season_id","round_number","team_code")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "official_game_code" integer;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "offensive_rebounds" integer;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "defensive_rebounds" integer;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "fouls_received" integer;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "blocks_against" integer;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "plus_minus" integer;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "games_started" integer;--> statement-breakpoint
ALTER TABLE "official_games" ADD CONSTRAINT "official_games_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_play_by_play" ADD CONSTRAINT "official_play_by_play_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_player_game_stats" ADD CONSTRAINT "official_player_game_stats_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_player_mappings" ADD CONSTRAINT "official_player_mappings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_player_mappings" ADD CONSTRAINT "official_player_mappings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_shots" ADD CONSTRAINT "official_shots_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_team_mappings" ADD CONSTRAINT "official_team_mappings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_team_mappings" ADD CONSTRAINT "official_team_mappings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_team_standings" ADD CONSTRAINT "official_team_standings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_official_games_season_schedule" ON "official_games" USING btree ("season_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_official_play_by_play_game" ON "official_play_by_play" USING btree ("season_id","game_code");--> statement-breakpoint
CREATE INDEX "idx_official_player_game_stats_game" ON "official_player_game_stats" USING btree ("season_id","game_code");--> statement-breakpoint
CREATE INDEX "idx_official_shots_game" ON "official_shots" USING btree ("season_id","game_code");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "unique_match_official_game" UNIQUE("season_id","official_game_code");