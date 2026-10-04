CREATE TABLE "personal_bid_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"league_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"seller_id" integer,
	"listing_price" integer NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"execute_at" timestamp with time zone NOT NULL,
	"amount_without_bids" integer NOT NULL,
	"amount_with_bids" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"queue_message_id" text,
	"result_code" text,
	"submitted_amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_bid_rules" ADD CONSTRAINT "personal_bid_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_personal_bid_rules_user_status" ON "personal_bid_rules" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_personal_bid_active_listing" ON "personal_bid_rules" USING btree ("user_id","league_id","player_id","closes_at") WHERE status IN ('pending', 'running', 'submitted', 'uncertain');--> statement-breakpoint
ALTER TABLE "personal_bid_rules" ADD CONSTRAINT "personal_bid_rules_status_check" CHECK ("status" IN ('pending', 'running', 'submitted', 'skipped', 'uncertain', 'failed', 'cancelled'));
--> statement-breakpoint
ALTER TABLE "personal_bid_rules" ADD CONSTRAINT "personal_bid_rules_amounts_check" CHECK ("amount_without_bids" > 0 AND "amount_with_bids" > 0 AND "listing_price" >= 0);
--> statement-breakpoint
ALTER TABLE "personal_bid_rules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "personal_bid_rules" FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE target_role text;
BEGIN
  FOR target_role IN SELECT unnest(ARRAY['anon', 'authenticated', 'service_role']) LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE "personal_bid_rules" FROM %I', target_role);
    END IF;
  END LOOP;
END $$;
