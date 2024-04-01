import TokenGenerator from 'token-generator';
import db from '../configuration/dbConfig.js'

const tokenGenerator = new TokenGenerator({
  salt: 'your secret ingredient for this magic recipe.',
  timestampMap: 'abcdefghij', // 10 chars array for obfuscation purposes
});

//CREATE
export async function insertUser(username, hashedPassword) {
  const result = await db.query(
    "INSERT INTO users (us, pw) VALUES ($1, $2) RETURNING id, us", 
    [username, hashedPassword]);
  return result.rows;
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

export async function findBrowserToken(token) {
  const result = await db.query(
    "SELECT * FROM browser_tokens WHERE token = $1", 
    [token]);
    
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
    "SELECT variable_name, value, unit,updated_at FROM variables WHERE user_id = $1",
    [stored_user_id]
  );
  return result.rows;
}

export async function getAllUserTokens(stored_user_id) {
  const result = await db.query(
    "SELECT id,token,created_at FROM tokens WHERE user_id = $1",
    [stored_user_id]
  );
  return result.rows;
}

//UPDATE
export async function updateUserUsername(id,us) {
  await db.query(
    "UPDATE users SET us = $1 WHERE id = $2", 
    [us,id]);
}
export async function updateUserPassword(id,pw) {
  await db.query(
    "UPDATE users SET pw = $1 WHERE id = $2", 
    [pw,id]);
}
export async function renewUserToken(token) {
  await db.query(
    "UPDATE tokens SET created_at = CURRENT_TIMESTAMP WHERE token = $1", 
    [token]);
}
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