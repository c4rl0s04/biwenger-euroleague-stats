ALTER TABLE "tournament_fixtures" DROP CONSTRAINT IF EXISTS "tournament_fixtures_tournament_id_tournaments_id_fk";--> statement-breakpoint
ALTER TABLE "tournament_phases" DROP CONSTRAINT IF EXISTS "tournament_phases_tournament_id_tournaments_id_fk";--> statement-breakpoint
ALTER TABLE "tournament_standings" DROP CONSTRAINT IF EXISTS "tournament_standings_tournament_id_tournaments_id_fk";--> statement-breakpoint
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'tournament_fixtures'::regclass
    AND contype = 'p';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'tournament_fixtures', constraint_name);
  END IF;
END $$;--> statement-breakpoint
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'tournaments'::regclass
    AND contype = 'p';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I CASCADE', 'tournaments', constraint_name);
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD COLUMN "internal_id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "internal_id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "unique_tournament" UNIQUE("season_id","id");--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_season_tournament_fk" FOREIGN KEY ("season_id","tournament_id") REFERENCES "public"."tournaments"("season_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_phases" ADD CONSTRAINT "tournament_phases_season_tournament_fk" FOREIGN KEY ("season_id","tournament_id") REFERENCES "public"."tournaments"("season_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_season_tournament_fk" FOREIGN KEY ("season_id","tournament_id") REFERENCES "public"."tournaments"("season_id","id") ON DELETE no action ON UPDATE no action;
