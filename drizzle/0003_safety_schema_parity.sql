CREATE TABLE IF NOT EXISTS "hoopgrid_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"game_date" date NOT NULL,
	"rows" text,
	"cols" text,
	"number" integer,
	"possible_counts" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "hoopgrid_challenges_game_date_unique" UNIQUE("game_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hoopgrid_guesses" (
	"id" text PRIMARY KEY NOT NULL,
	"challenge_id" text,
	"user_id" text,
	"cell_index" integer NOT NULL,
	"player_id" integer,
	"is_correct" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_guess" UNIQUE("challenge_id","user_id","cell_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "playoff_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"stage" text,
	"match_id" text,
	"predicted_winner_id" integer,
	"prediction_details" text,
	"points" integer DEFAULT 0,
	"is_correct" boolean,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_playoff_prediction" UNIQUE("user_id","stage","match_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "playoff_results" (
	"match_id" text PRIMARY KEY NOT NULL,
	"stage" text,
	"winner_id" integer,
	"score" text,
	"is_completed" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_playoff_media" (
	"user_id" text PRIMARY KEY NOT NULL,
	"prediction_image_url" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "city" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "arena_name" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "latitude" double precision;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "longitude" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "biwenger_token" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hoopgrid_challenges" ADD CONSTRAINT "hoopgrid_challenges_game_date_unique" UNIQUE("game_date");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hoopgrid_guesses" ADD CONSTRAINT "unique_guess" UNIQUE("challenge_id","user_id","cell_index");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playoff_predictions" ADD CONSTRAINT "unique_playoff_prediction" UNIQUE("user_id","stage","match_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hoopgrid_guesses" ADD CONSTRAINT "hoopgrid_guesses_challenge_id_hoopgrid_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."hoopgrid_challenges"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hoopgrid_guesses" ADD CONSTRAINT "hoopgrid_guesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hoopgrid_guesses" ADD CONSTRAINT "hoopgrid_guesses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playoff_predictions" ADD CONSTRAINT "playoff_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playoff_predictions" ADD CONSTRAINT "playoff_predictions_predicted_winner_id_teams_id_fk" FOREIGN KEY ("predicted_winner_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playoff_results" ADD CONSTRAINT "playoff_results_winner_id_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_playoff_media" ADD CONSTRAINT "user_playoff_media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
