CREATE TABLE "market_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"listed_at" date,
	"price" integer,
	"seller_id" text,
	"seller_name" text,
	CONSTRAINT "unique_market_listing" UNIQUE("player_id","listed_at")
);