CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'review_ready', 'failed', 'done');--> statement-breakpoint
CREATE TABLE "job" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"original_filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"byte_size" integer NOT NULL,
	"mime_type" text,
	"checksum" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_status_idx" ON "job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_created_at_idx" ON "job" USING btree ("created_at");