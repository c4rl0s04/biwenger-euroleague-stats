ALTER TABLE "seasons" ADD COLUMN "is_sync_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "euroleague_code" text;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_season" ON "seasons" USING btree ("status") WHERE status = 'active';