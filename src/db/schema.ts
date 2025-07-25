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
    // Vector similarity index using ivfflat for cosine distance
    embeddingIdx: index("embedding_cosine_idx").using("ivfflat", table.embedding.op("vector_cosine_ops")),
    // Compound index for script filtering + performance
    scriptIdx: index("script_idx").on(table.scriptId),
    // Index for chunk ordering within scripts
    chunkOrderIdx: index("chunk_order_idx").on(table.scriptId, table.chunkIndex),
  };
});

export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  queryEmbedding: vector("query_embedding", { dimensions: 768 }),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Index for search history queries
    searchedAtIdx: index("searched_at_idx").on(table.searchedAt),
  };
});