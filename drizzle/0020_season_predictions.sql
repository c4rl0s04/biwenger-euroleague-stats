CREATE TABLE "season_prediction_submissions" (
	"season_id" text NOT NULL,
	"user_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_prediction_submissions_season_id_user_id_pk" PRIMARY KEY("season_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "season_prediction_windows" (
	"season_id" text PRIMARY KEY NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"locks_at" timestamp with time zone NOT NULL,
	"question_set_version" text NOT NULL,
	"questions" jsonb NOT NULL,
	"candidates" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ADD CONSTRAINT "season_prediction_submissions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ADD CONSTRAINT "season_prediction_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ADD CONSTRAINT "season_prediction_submissions_member_fk" FOREIGN KEY ("season_id","user_id") REFERENCES "public"."user_seasons"("season_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_prediction_windows" ADD CONSTRAINT "season_prediction_windows_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "season_prediction_windows" ADD CONSTRAINT "season_prediction_window_order" CHECK ("locks_at" > "opens_at");
--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ADD CONSTRAINT "season_prediction_revision_positive" CHECK ("revision" > 0);
--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ADD CONSTRAINT "season_prediction_answers_object" CHECK (jsonb_typeof("answers") = 'object');
--> statement-breakpoint
ALTER TABLE "season_prediction_windows" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "season_prediction_submissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "season_prediction_windows", "season_prediction_submissions" FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE target_role text;
BEGIN
  FOR target_role IN SELECT unnest(ARRAY['anon', 'authenticated', 'service_role']) LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE "season_prediction_windows", "season_prediction_submissions" FROM %I', target_role);
    END IF;
  END LOOP;
END $$;
