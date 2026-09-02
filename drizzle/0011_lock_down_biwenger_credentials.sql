ALTER TABLE "user_biwenger_credentials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "user_biwenger_credentials" FROM PUBLIC, anon, authenticated;
