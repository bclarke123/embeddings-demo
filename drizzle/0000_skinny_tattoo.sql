CREATE TABLE "script_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"script_id" integer NOT NULL,
	"content" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"embedding" vector(768),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"query_embedding" vector(768),
	"searched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "script_chunks" ADD CONSTRAINT "script_chunks_script_id_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embedding_cosine_idx" ON "script_chunks" USING ivfflat ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "script_idx" ON "script_chunks" USING btree ("script_id");--> statement-breakpoint
CREATE INDEX "chunk_order_idx" ON "script_chunks" USING btree ("script_id","chunk_index");--> statement-breakpoint
CREATE INDEX "searched_at_idx" ON "searches" USING btree ("searched_at");