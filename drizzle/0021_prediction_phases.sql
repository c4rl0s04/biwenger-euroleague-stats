CREATE TABLE "official_schedule_games" (
	"season_id" text NOT NULL,
	"game_code" integer NOT NULL,
	"phase_code" text NOT NULL,
	"round_code" text,
	"round_number" integer,
	"home_team_code" text NOT NULL,
	"away_team_code" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"is_played" boolean NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "official_schedule_games_pkey" PRIMARY KEY("season_id","game_code")
);
--> statement-breakpoint
ALTER TABLE "official_schedule_games" ADD CONSTRAINT "official_schedule_games_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_official_schedule_games_phase" ON "official_schedule_games" USING btree ("season_id","phase_code");--> statement-breakpoint
ALTER TABLE "official_schedule_games" ADD CONSTRAINT "official_schedule_games_phase_code" CHECK ("phase_code" IN ('RS', 'PI', 'PO', 'FF'));
--> statement-breakpoint
-- Existing windows and submissions all belong to the preseason questionnaire. The temporary
-- default only backfills those rows; new rows must always state their phase.
ALTER TABLE "season_prediction_windows" ADD COLUMN "phase" text NOT NULL DEFAULT 'preseason';--> statement-breakpoint
ALTER TABLE "season_prediction_windows" ALTER COLUMN "phase" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "season_prediction_windows" ADD COLUMN "reopened_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "season_prediction_windows" ADD CONSTRAINT "season_prediction_window_phase" CHECK ("phase" IN ('preseason', 'playoffs'));--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ADD COLUMN "phase" text NOT NULL DEFAULT 'preseason';--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ALTER COLUMN "phase" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" DROP CONSTRAINT "season_prediction_submissions_season_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ADD CONSTRAINT "season_prediction_submissions_pkey" PRIMARY KEY("season_id","phase","user_id");--> statement-breakpoint
ALTER TABLE "season_prediction_windows" DROP CONSTRAINT "season_prediction_windows_pkey";--> statement-breakpoint
ALTER TABLE "season_prediction_windows" ADD CONSTRAINT "season_prediction_windows_pkey" PRIMARY KEY("season_id","phase");--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ADD CONSTRAINT "season_prediction_submissions_window_fk" FOREIGN KEY ("season_id","phase") REFERENCES "public"."season_prediction_windows"("season_id","phase") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "official_schedule_games" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "official_schedule_games" FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE target_role text;
BEGIN
  FOR target_role IN SELECT unnest(ARRAY['anon', 'authenticated', 'service_role']) LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE "official_schedule_games" FROM %I', target_role);
    END IF;
  END LOOP;
END $$;
