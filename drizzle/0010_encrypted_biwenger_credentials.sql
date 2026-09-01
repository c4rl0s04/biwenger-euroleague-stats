CREATE TABLE "user_biwenger_credentials" (
	"user_id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"key_id" text NOT NULL,
	"ciphertext" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_biwenger_credentials" ADD CONSTRAINT "user_biwenger_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_biwenger_credentials_key_id" ON "user_biwenger_credentials" USING btree ("key_id");