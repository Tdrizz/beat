CREATE TABLE "ai_usage_daily" (
	"day" date NOT NULL,
	"kind" varchar(24) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_usage_daily_day_kind_pk" PRIMARY KEY("day","kind")
);
