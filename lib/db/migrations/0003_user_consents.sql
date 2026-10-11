CREATE TABLE "user_consents" (
	"user_id" varchar(64) NOT NULL,
	"kind" varchar(32) NOT NULL,
	"version" varchar(16) NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_consents_pk_idx" ON "user_consents" USING btree ("user_id","kind");