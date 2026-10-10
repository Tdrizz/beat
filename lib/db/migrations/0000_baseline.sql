CREATE TABLE "profiles" (
	"user_id" varchar(64) PRIMARY KEY NOT NULL,
	"handle" varchar(32) NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"skin_tone" varchar(24),
	"archetype" varchar(16),
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_creator" boolean DEFAULT false NOT NULL,
	"premium_until" timestamp with time zone,
	"stripe_customer_id" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "saved_combos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"look_id" varchar(64) NOT NULL,
	"wig_style_id" varchar(48) NOT NULL,
	"wig_color_id" varchar(48),
	"intensity" integer DEFAULT 60 NOT NULL,
	"name" varchar(80) DEFAULT 'Untitled combo' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" varchar(64) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" varchar(64) NOT NULL,
	"followee_id" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"post_id" uuid NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" varchar(64) NOT NULL,
	"kind" varchar(16) NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"image_url" text NOT NULL,
	"look_id" varchar(80),
	"custom_look" jsonb,
	"season" varchar(16),
	"mood" varchar(32),
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a" varchar(64) NOT NULL,
	"user_b" varchar(64) NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"last_message_preview" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" varchar(64) NOT NULL,
	"body" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"creator_id" varchar(64),
	"post_id" uuid,
	"viewer_id" varchar(64),
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" varchar(48) PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"logo_url" text,
	"website" text,
	"bio" text DEFAULT '' NOT NULL,
	"default_commission_bps" integer DEFAULT 800 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "look_products" (
	"look_id" varchar(80) NOT NULL,
	"product_id" uuid NOT NULL,
	"step" varchar(16) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" varchar(48) NOT NULL,
	"name" varchar(120) NOT NULL,
	"category" varchar(24) NOT NULL,
	"image_url" text,
	"color" varchar(16),
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" varchar(4) DEFAULT 'USD' NOT NULL,
	"affiliate_url" text NOT NULL,
	"commission_bps" integer,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" varchar(64) NOT NULL,
	"actor_id" varchar(64),
	"kind" varchar(24) NOT NULL,
	"post_id" uuid,
	"conversation_id" uuid,
	"body" text DEFAULT '' NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submitted_tutorials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" varchar(64) NOT NULL,
	"title" varchar(120) NOT NULL,
	"category" varchar(24) NOT NULL,
	"difficulty" varchar(16) NOT NULL,
	"minutes" integer NOT NULL,
	"thumbnail" text NOT NULL,
	"summary" varchar(240) NOT NULL,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pro_tip" text,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"moderation_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tutorial_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutorial_id" varchar(80) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutorial_id" varchar(80) NOT NULL,
	"author_id" varchar(64) NOT NULL,
	"rating" integer NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_step_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutorial_id" varchar(80) NOT NULL,
	"step_index" integer NOT NULL,
	"video_url" text NOT NULL,
	"video_poster" text,
	"updated_by" varchar(64) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" varchar(64) NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"learnings" text[] DEFAULT '{}'::text[] NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"duration_min" integer DEFAULT 30 NOT NULL,
	"difficulty" varchar(16) DEFAULT 'beginner' NOT NULL,
	"mood_tag" varchar(24) DEFAULT 'everyday' NOT NULL,
	"cover_url" text,
	"video_url" text,
	"is_premium" boolean DEFAULT false NOT NULL,
	"status" varchar(16) DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wig_tryons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"wig_id" varchar(64) NOT NULL,
	"wig_name" varchar(80) NOT NULL,
	"color_id" varchar(40) NOT NULL,
	"color_name" varchar(60) NOT NULL,
	"image_path" text NOT NULL,
	"angle_label" varchar(40) DEFAULT 'Front' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digest_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"week_start" date NOT NULL,
	"tutorial_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_preferences" (
	"user_id" varchar(64) PRIMARY KEY NOT NULL,
	"weekly_digest" boolean DEFAULT true NOT NULL,
	"unsubscribe_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_preferences_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "object_acls" (
	"object_path" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"visibility" varchar(8) NOT NULL,
	"acl_rules" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "saved_combos_user_idx" ON "saved_combos" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "post_comments" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_pk_idx" ON "follows" USING btree ("follower_id","followee_id");--> statement-breakpoint
CREATE INDEX "follows_followee_idx" ON "follows" USING btree ("followee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "likes_pk_idx" ON "post_likes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "likes_user_idx" ON "post_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "posts_created_idx" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "posts_season_idx" ON "posts" USING btree ("season");--> statement-breakpoint
CREATE UNIQUE INDEX "conv_pair_idx" ON "conversations" USING btree ("user_a","user_b");--> statement-breakpoint
CREATE INDEX "conv_user_a_idx" ON "conversations" USING btree ("user_a","last_message_at");--> statement-breakpoint
CREATE INDEX "conv_user_b_idx" ON "conversations" USING btree ("user_b","last_message_at");--> statement-breakpoint
CREATE INDEX "msg_conv_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "clicks_creator_idx" ON "affiliate_clicks" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX "clicks_product_idx" ON "affiliate_clicks" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "lp_look_idx" ON "look_products" USING btree ("look_id");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "notif_recipient_idx" ON "notifications" USING btree ("recipient_id","created_at");--> statement-breakpoint
CREATE INDEX "notif_unread_idx" ON "notifications" USING btree ("recipient_id","read_at");--> statement-breakpoint
CREATE INDEX "submitted_tutorial_author_idx" ON "submitted_tutorials" USING btree ("author_id","updated_at");--> statement-breakpoint
CREATE INDEX "submitted_tutorial_status_idx" ON "submitted_tutorials" USING btree ("status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tutorial_bookmark_pk_idx" ON "tutorial_bookmarks" USING btree ("tutorial_id","user_id");--> statement-breakpoint
CREATE INDEX "tutorial_bookmark_user_idx" ON "tutorial_bookmarks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tutorial_review_pk_idx" ON "tutorial_reviews" USING btree ("tutorial_id","author_id");--> statement-breakpoint
CREATE INDEX "tutorial_review_tutorial_idx" ON "tutorial_reviews" USING btree ("tutorial_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tutorial_step_video_pk_idx" ON "tutorial_step_videos" USING btree ("tutorial_id","step_index");--> statement-breakpoint
CREATE INDEX "rsvp_class_idx" ON "class_reservations" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "rsvp_user_idx" ON "class_reservations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rsvp_user_class_uniq" ON "class_reservations" USING btree ("user_id","class_id");--> statement-breakpoint
CREATE INDEX "classes_instructor_idx" ON "classes" USING btree ("instructor_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "classes_schedule_idx" ON "classes" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "chat_messages_thread_idx" ON "chat_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_threads_user_idx" ON "chat_threads" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "wig_tryons_user_idx" ON "wig_tryons" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "digest_send_pk_idx" ON "digest_sends" USING btree ("user_id","week_start");--> statement-breakpoint
CREATE INDEX "digest_send_user_idx" ON "digest_sends" USING btree ("user_id","sent_at");--> statement-breakpoint
CREATE INDEX "object_acls_owner_idx" ON "object_acls" USING btree ("owner_id");