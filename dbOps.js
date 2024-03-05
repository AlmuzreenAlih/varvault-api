import pg from "pg";
import TokenGenerator from 'token-generator';

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PW,
  port: process.env.PG_PORT,
});
db.connect();

const tokenGenerator = new TokenGenerator({
  salt: 'your secret ingredient for this magic recipe.',
  timestampMap: 'abcdefghij', // 10 chars array for obfuscation purposes
});

//CREATE
export async function insertUser(username, hashedPassword) {
  db.query(
    "INSERT INTO users (us, pw) VALUES ($1, $2)", 
    [username, hashedPassword]);
}
export async function insertVariableName(stored_user_id, variable_name, value, variable_type, unit) {
  db.query(
    "INSERT INTO variables (user_id, variable_name, value, variable_type,unit,updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)",
    [stored_user_id, variable_name, value, variable_type, unit]
  );
}
export async function insertGeneratedToken(stored_user_id) {
  var token = tokenGenerator.generate();
  db.query(
    "INSERT INTO tokens (user_id, token) VALUES ($1, $2)",
    [stored_user_id, token]
  );
  return token;
}

//READ
export async function selectUserByUsername(username) {
  const result = await db.query(
    "SELECT * FROM users WHERE us = $1", 
    [username]);
  return result.rows;
}
export async function findVariableName(variable_name,stored_user_id) {
  const result = await db.query(
    "SELECT * FROM variables WHERE user_id = $1 AND variable_name = $2",
    [stored_user_id, variable_name]
  );
  return result.rows;
}
export async function selectToken(token) {
  const result = await db.query(
    "SELECT * FROM tokens WHERE token = $1",
    [token]
  );
  return result.rows;
}
export async function getAllVariables(stored_user_id) {
  const result = await db.query(
    "SELECT variable_name, value, updated_at FROM variables WHERE user_id = $1",
    [stored_user_id]
  );
  return result.rows;
}
//UPDATE
export async function updateVariable(id,value) {
  await db.query(
    "UPDATE variables SET value = $1 WHERE id = $2", 
    [value,id]);
}

//DELETE
export async function deleteVariable(id) {
  await db.query(
    "DELETE FROM variables WHERE id = $1", 
    [id]);
}