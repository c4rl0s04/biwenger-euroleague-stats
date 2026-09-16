-- Step 1: Backfill missing user_seasons records referenced by seasonal tables
INSERT INTO "user_seasons" ("season_id", "user_id", "name", "icon", "color_index", "status")
SELECT sub.season_id, sub.user_id, COALESCE(u.name, 'Manager ' || sub.user_id), u.icon, COALESCE(u.color_index, 0), 'active'
FROM (
  SELECT season_id, user_id FROM user_rounds WHERE user_id IS NOT NULL
  UNION
  SELECT season_id, user_id FROM lineups WHERE user_id IS NOT NULL
  UNION
  SELECT season_id, user_id FROM initial_squads WHERE user_id IS NOT NULL
  UNION
  SELECT season_id, user_id FROM finances WHERE user_id IS NOT NULL
  UNION
  SELECT season_id, owner_id AS user_id FROM player_seasons WHERE owner_id IS NOT NULL
  UNION
  SELECT season_id, user_id FROM playoff_predictions WHERE user_id IS NOT NULL
  UNION
  SELECT season_id, user_id FROM user_playoff_media WHERE user_id IS NOT NULL
  UNION
  SELECT season_id, user_id FROM porras WHERE user_id IS NOT NULL
  UNION
  SELECT season_id, bidder_id AS user_id FROM transfer_bids WHERE bidder_id IS NOT NULL
  UNION
  SELECT season_id, seller_id AS user_id FROM market_listings WHERE seller_id IS NOT NULL
  UNION
  SELECT season_id, home_user_id AS user_id FROM tournament_fixtures WHERE home_user_id IS NOT NULL
  UNION
  SELECT season_id, away_user_id AS user_id FROM tournament_fixtures WHERE away_user_id IS NOT NULL
  UNION
  SELECT season_id, user_id FROM tournament_standings WHERE user_id IS NOT NULL
) sub
LEFT JOIN "users" u ON u.id = sub.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM "user_seasons" us
  WHERE us.season_id = sub.season_id AND us.user_id = sub.user_id
)
AND EXISTS (
  SELECT 1 FROM "users" u2 WHERE u2.id = sub.user_id
);
--> statement-breakpoint

-- Step 2: Backfill missing attributes on user_seasons from users
UPDATE "user_seasons" AS us
SET
  "name" = COALESCE(us."name", u."name", 'Manager ' || us."user_id"),
  "icon" = COALESCE(us."icon", u."icon"),
  "color_index" = COALESCE(us."color_index", u."color_index", 0),
  "status" = COALESCE(us."status", 'active')
FROM "users" AS u
WHERE us."user_id" = u."id";
--> statement-breakpoint

-- Ensure fallback values for any rows still containing NULLs
UPDATE "user_seasons"
SET
  "name" = COALESCE("name", 'Manager ' || "user_id"),
  "color_index" = COALESCE("color_index", 0),
  "status" = COALESCE("status", 'active')
WHERE "name" IS NULL OR "color_index" IS NULL OR "status" IS NULL;
--> statement-breakpoint

-- Step 3: Drop redundant constraints and indexes on user_seasons
ALTER TABLE "user_seasons" DROP CONSTRAINT IF EXISTS "unique_user_season";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_user_seasons_season_user";
--> statement-breakpoint

-- Step 4: Drop old primary key and id column from user_seasons
ALTER TABLE "user_seasons" DROP CONSTRAINT IF EXISTS "user_seasons_pkey";
--> statement-breakpoint
ALTER TABLE "user_seasons" DROP COLUMN IF EXISTS "id";
--> statement-breakpoint

-- Step 5: Enforce NOT NULL and defaults on user_seasons
ALTER TABLE "user_seasons" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_seasons" ALTER COLUMN "color_index" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_seasons" ALTER COLUMN "color_index" SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "user_seasons" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_seasons" ALTER COLUMN "status" SET DEFAULT 'active';
--> statement-breakpoint

-- Step 6: Add composite primary key to user_seasons
ALTER TABLE "user_seasons" ADD CONSTRAINT "user_seasons_pkey" PRIMARY KEY("season_id", "user_id");
--> statement-breakpoint

-- Step 7: Drop single-column foreign keys replaced by composite keys
ALTER TABLE "playoff_predictions" DROP CONSTRAINT IF EXISTS "playoff_predictions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_playoff_media" DROP CONSTRAINT IF EXISTS "user_playoff_media_user_id_users_id_fk";
--> statement-breakpoint

-- Step 8: Add composite foreign keys referencing user_seasons(season_id, user_id)
ALTER TABLE "finances" ADD CONSTRAINT "finances_season_user_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "initial_squads" ADD CONSTRAINT "initial_squads_season_user_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_season_user_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_season_seller_fk" FOREIGN KEY ("season_id","seller_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "player_seasons" ADD CONSTRAINT "player_seasons_season_owner_fk" FOREIGN KEY ("season_id","owner_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "playoff_predictions" ADD CONSTRAINT "playoff_predictions_season_user_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "porras" ADD CONSTRAINT "porras_season_user_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_season_home_user_fk" FOREIGN KEY ("season_id","home_user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_season_away_user_fk" FOREIGN KEY ("season_id","away_user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_season_user_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transfer_bids" ADD CONSTRAINT "transfer_bids_season_bidder_fk" FOREIGN KEY ("season_id","bidder_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_playoff_media" ADD CONSTRAINT "user_playoff_media_season_user_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_rounds" ADD CONSTRAINT "user_rounds_season_user_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Step 9: Drop deprecated global manager columns from users
ALTER TABLE "users" DROP COLUMN IF EXISTS "icon";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "color_index";