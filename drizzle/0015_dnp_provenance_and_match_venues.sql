ALTER TABLE "matches" ADD COLUMN "arena_code" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "arena_name" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "arena_capacity" integer;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "is_dnp" boolean;--> statement-breakpoint
ALTER TABLE "player_round_stats" ADD COLUMN "official_game_code" integer;
