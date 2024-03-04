import pg from "pg";
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PW,
  port: process.env.PG_PORT,
});
db.connect();

export async function selectUserByUsername(username) {
  const result = await db.query(
    "SELECT * FROM users WHERE us = $1", 
    [username]);
  return result.rows;
}

export async function insertUser(username, hashedPassword) {
  db.query(
    "INSERT INTO users (us, pw) VALUES ($1, $2)", 
    [username, hashedPassword]);
}