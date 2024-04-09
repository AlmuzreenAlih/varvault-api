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
    "INSERT INTO variables (user_id, variable_name, value, variable_type,unit,created_at,updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
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

export async function insertGeneratedBrowserToken(stored_user_id, token) {
  db.query(
    "INSERT INTO browser_tokens (user_id, token) VALUES ($1, $2)",
    [stored_user_id, token]
  );
  return token;
}

export async function logger(gateway, category, user_id, pointing_id, operation) {
  var token = tokenGenerator.generate();
  db.query(
    "INSERT INTO logs (gateway, category, user_id, pointing_id, operation) VALUES ($1, $2, $3, $4, $5)",
    [gateway, category, user_id, pointing_id, operation]
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

export async function findVariableNameByID(variable_id,stored_user_id) {
  const result = await db.query(
    "SELECT * FROM variables WHERE user_id = $1 AND id = $2",
    [stored_user_id, variable_id]
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
    "SELECT * FROM variables WHERE user_id = $1",
    [stored_user_id]
  );
  
  return result.rows;
}

export async function getVariables(stored_user_id,order_by,order,offset) {
  let result;
  if (order_by==="") {
    result = await db.query(
      "SELECT * FROM variables WHERE user_id = $1 ORDER BY id ASC LIMIT 10 OFFSET $2",
      [stored_user_id,offset]
    );
  } else {
    let orderByClause = "";
    if (order === "true") {order = "ASC";} else {order = "DESC";}
    orderByClause = `ORDER BY ${order_by} ${order}`;
    result = await db.query(
      `SELECT * FROM variables WHERE user_id = $1 ${orderByClause} LIMIT 10 OFFSET $2`,
      [stored_user_id,offset]
    );
  }
  return result.rows;
}

export async function countAllVariables(stored_user_id) {
  let result;
  if (true) {console.log("Default");
    result = await db.query(
      "SELECT COUNT(*) AS total_count FROM variables WHERE user_id = $1",
      [stored_user_id]
    );
  }
  return result.rows;
}

export async function getUserTokens(stored_user_id,order_by,order,offset) {
  let result;
  console.log(order_by,order,offset)
  if (order_by==="") {
    result = await db.query(
      "SELECT * FROM tokens WHERE user_id = $1  ORDER BY id ASC LIMIT 10 OFFSET $2",
      [stored_user_id,offset]
    );
  } else {
    let orderByClause = "";
    if (order === "true") {order = "ASC";} else {order = "DESC";}
    orderByClause = `ORDER BY ${order_by} ${order}`;
    console.log(`SELECT * FROM tokens WHERE user_id = $1 ${orderByClause} LIMIT 10 OFFSET $2`)
    result = await db.query(
      `SELECT * FROM tokens WHERE user_id = $1 ${orderByClause} LIMIT 10 OFFSET $2`,
      [stored_user_id,offset]
    );
  }
  
  return result.rows;
}

export async function getAllUserTokens(stored_user_id) {
  const result = await db.query(
    "SELECT * FROM tokens WHERE user_id = $1 ORDER BY id ASC",
    [stored_user_id]
  );
  return result.rows;
}

export async function getAllLogs(stored_user_id) {
  const result = await db.query(
    "SELECT * FROM logs WHERE user_id = $1 ORDER BY id DESC",
    [stored_user_id]
  );
  return result.rows;
}

export async function getLogsCursored(stored_user_id,cursor_id) {
  let result;
  if (cursor_id === undefined) {
    result = await db.query(
      "SELECT * FROM logs WHERE user_id = $1 ORDER BY id DESC",
      [stored_user_id]
    );
  } else {
    result = await db.query(
      "SELECT * FROM logs WHERE user_id = $1 AND id < $2 ORDER BY id DESC LIMIT 10",
      [stored_user_id,cursor_id]
    );
  }
  return result.rows;
}

export async function getVariablesCursored(stored_user_id,cursor_id) {
  let result;
  if (cursor_id === undefined) {
    result = await db.query(
      "SELECT * FROM variables WHERE user_id = $1 ORDER BY id ASC",
      [stored_user_id]
    );
  } else {
    result = await db.query(
      "SELECT * FROM variables WHERE user_id = $1 AND id > $2 ORDER BY id ASC LIMIT 10",
      [stored_user_id,cursor_id]
    );
  }
  return result.rows;
}

export async function getTokensCursored(stored_user_id,cursor_id) {
  let result;
  if (cursor_id === undefined) {
    result = await db.query(
      "SELECT * FROM tokens WHERE user_id = $1 ORDER BY id ASC",
      [stored_user_id]
    );
  } else {
    result = await db.query(
      "SELECT * FROM tokens WHERE user_id = $1 AND id > $2 ORDER BY id ASC LIMIT 10",
      [stored_user_id,cursor_id]
    );
  }
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
    "UPDATE tokens SET updated_at = CURRENT_TIMESTAMP WHERE token = $1", 
    [token]);
}
export async function renewUserTokenbyID(token_id) {
  await db.query(
    "UPDATE tokens SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", 
    [token_id]);
}
export async function updateVariable(id,value) {
  await db.query(
    "UPDATE variables SET value = $1 WHERE id = $2", 
    [value,id]);
}
export async function editVariable(id,name,value,type,unit) {
  const result = await db.query(
    "UPDATE variables SET variable_name=$1, value=$2, variable_type=$3, unit=$4, updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *", 
    [name,value,type,unit,id]);

  return result.rows;
}
//DELETE
export async function deleteVariable(id) {
  await db.query(
    "DELETE FROM variables WHERE id = $1", 
    [id]);
}
export async function deleteVariablesMultiple(ids) {
  // Construct the placeholder string for the array of IDs
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');

  // Construct the SQL query with the IN operator and the array of IDs
  const query = `
    DELETE FROM variables
    WHERE id IN (${placeholders})
  `;
  
  // Execute the query
  await db.query(query, ids);
}
export async function deleteToken(id) {
  await db.query(
    "DELETE FROM tokens WHERE id = $1", 
    [id]);
}