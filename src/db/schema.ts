import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { vector } from "./vector";

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const scriptChunks = pgTable("script_chunks", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").references(() => scripts.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    embeddingIdx: index("embedding_idx"),
    scriptIdx: index("script_idx").on(table.scriptId),
  };
});

export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  queryEmbedding: vector("query_embedding", { dimensions: 768 }),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});