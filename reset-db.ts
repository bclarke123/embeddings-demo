import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(connectionString);

console.log("Dropping existing tables...");

try {
  await sql`DROP TABLE IF EXISTS script_chunks CASCADE`;
  await sql`DROP TABLE IF EXISTS searches CASCADE`;
  await sql`DROP TABLE IF EXISTS scripts CASCADE`;
  console.log("Tables dropped successfully!");
  
  console.log("Running migrations...");
  const migration = await Bun.file("./src/db/migrations/0001_initial.sql").text();
  await sql.unsafe(migration);
  console.log("Migrations completed successfully!");
} catch (error) {
  console.error("Database reset failed:", error);
} finally {
  await sql.end();
}