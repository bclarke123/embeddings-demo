import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(connectionString);

console.log("Running migrations...");

try {
  const migration = await Bun.file("./src/db/migrations/0001_initial.sql").text();
  await sql.unsafe(migration);
  console.log("Migrations completed successfully!");
} catch (error) {
  console.error("Migration failed:", error);
} finally {
  await sql.end();
}