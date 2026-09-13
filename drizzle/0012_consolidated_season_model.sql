CREATE TABLE "team_seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" text DEFAULT '2025-26' NOT NULL,
	"team_id" integer NOT NULL,
	"name" text,
	"short_name" text,
	"img" text,
	"city" text,
	"arena_name" text,
	"latitude" double precision,
	"longitude" double precision,
	"snapshot_source" text DEFAULT 'sync' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_team_season" UNIQUE("season_id","team_id")
);
--> statement-breakpoint
DROP TABLE "official_games" CASCADE;--> statement-breakpoint
DROP TABLE "official_player_game_stats" CASCADE;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_coach" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_coach" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "referee_1" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "referee_2" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "referee_3" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "payload_checksum" text;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "minutes_seconds" integer;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "dorsal" text;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "raw_payload" jsonb;--> statement-breakpoint
ALTER TABLE "player_seasons" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "player_seasons" ADD COLUMN "dorsal" text;--> statement-breakpoint
ALTER TABLE "player_seasons" ADD COLUMN "roster_snapshot_source" text;--> statement-breakpoint
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_team_seasons_season_team" ON "team_seasons" USING btree ("season_id","team_id");