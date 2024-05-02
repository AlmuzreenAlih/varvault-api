import TokenGenerator from 'token-generator';
import connection from '../configuration/dbConfig.js'

const tokenGenerator = new TokenGenerator({
  salt: 'your secret ingredient for this magic recipe.',
  timestampMap: 'abcdefghij', // 10 chars array for obfuscation purposes
});

//CREATE
export async function insertUser(username, hashedPassword) { 
  return new Promise((resolve, reject) => {
    connection.query(
      "INSERT INTO users (us, pw, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)", 
      [username, hashedPassword], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve({id: results['insertId']})}}
    );
  });
}
// insertUser("hellogello", "Gfdhgfdhgfd");
export async function insertVariableName(stored_user_id, variable_name, value, variable_type, unit) {
  return new Promise((resolve, reject) => {
    connection.query(
      "INSERT INTO variables (user_id, variable_name, value, variable_type, unit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", 
      [stored_user_id, variable_name, value, variable_type, unit], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve({id: results['insertId']});}}
    );
  });
}
// console.log(await insertVariableName(44, "Dummy", "haha", "0", "numeric"))
export async function insertGeneratedToken(stored_user_id) {
  var token = tokenGenerator.generate();
  return new Promise((resolve, reject) => {
    connection.query(
      "INSERT INTO tokens (user_id, token, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
      [stored_user_id, token], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve({id: results['insertId'], token: token});}}
    );
  });
}
// console.log(await insertGeneratedToken(42))
export async function insertGeneratedBrowserToken(stored_user_id, token) {
  return new Promise((resolve, reject) => {
    connection.query(
      "INSERT INTO browser_tokens (user_id, token, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [stored_user_id, token], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(token)}}
    );
  });
}

export async function logger(gateway, category, user_id, pointing_id, operation) {
  return new Promise((resolve, reject) => {
    connection.query(
      "INSERT INTO logs (gateway, category, user_id, pointing_id, operation, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [gateway, category, user_id, pointing_id, operation], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}

//READ
export async function selectUserByUsername(username) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM users WHERE us = ?", 
      [username], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function selectUserByID(id) {
  const result = await db.query(
    "SELECT * FROM users WHERE id = $1", 
    [id]);
  return result.rows;
}
export async function getUserCreation(id) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM users WHERE id = ?", 
      [id], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function findVariableName(variable_name,stored_user_id) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM variables WHERE user_id = ? AND variable_name = ?",
      [stored_user_id, variable_name], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}

export async function findVariableNameByID(variable_id,stored_user_id) {
  const result = await db.query(
    "SELECT * FROM variables WHERE user_id = $1 AND id = $2",
    [stored_user_id, variable_id]
  );
  return result.rows;
}
export async function selectTokenByID(token_id,stored_user_id) {
  const result = await db.query(
    "SELECT * FROM tokens WHERE user_id = $1 and id = $2",
    [stored_user_id, token_id]
  );
  return result.rows;
}
export async function findBrowserToken(token) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM browser_tokens WHERE token = ?", 
      [token], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
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

export async function getVariables(stored_user_id,order_by,order,offset, search) {
  if (order_by==="") {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM variables WHERE user_id = ? AND variable_name LIKE ? ORDER BY id ASC LIMIT 10 OFFSET ?",
        [stored_user_id, '%' + search + '%', offset], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  } else {
    let orderByClause = "";
    if (order === "true") {order = "ASC";} else {order = "DESC";}
    orderByClause = `ORDER BY ${order_by} ${order}`;
    return new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM variables WHERE user_id = ? AND variable_name LIKE ? ${orderByClause} LIMIT 10 OFFSET ?`,
        [stored_user_id, '%' + search + '%',offset], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  }
}

export async function countAllVariables(stored_user_id,search) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT COUNT(*) AS total_count FROM variables WHERE user_id = ? AND variable_name LIKE ?",
      [stored_user_id, '%' + search + '%'], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}

export async function countAllTokens(stored_user_id) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT COUNT(*) AS total_count FROM tokens WHERE user_id = ?",
      [stored_user_id], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}

export async function countAllLogs(stored_user_id, startDate, endDate, category) {
  if (startDate) {
    if (category) {
      return new Promise((resolve, reject) => {
        connection.query(
          "SELECT COUNT(*) AS total_count FROM logs WHERE user_id = ? AND created_at >= ? AND created_at <= ? AND category ILIKE ?",
          [stored_user_id, startDate, endDate, category], 
          (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
        );
      });
    } else {console.log("no cat");
      return new Promise((resolve, reject) => {
        connection.query(
          "SELECT COUNT(*) AS total_count FROM logs WHERE user_id = ? AND created_at >= ? AND created_at <= ?",
          [stored_user_id, startDate, endDate], 
          (error, results, fields) => {  if (error) {reject(error);}   else {resolve(results)}  }
        );
      });
    }
  } else {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT COUNT(*) AS total_count FROM logs WHERE user_id = ?",
        [stored_user_id], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  }
}

export async function getUserTokens(stored_user_id,order_by,order,offset) {
  let result;
  console.log(order_by,order,offset)
  if (order_by==="") {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM tokens WHERE user_id = ?  ORDER BY id ASC LIMIT 10 OFFSET ?",
        [stored_user_id,offset], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  } else {
    let orderByClause = "";
    if (order === "true") {order = "ASC";} else {order = "DESC";}
    orderByClause = `ORDER BY ${order_by} ${order}`;

    return new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM tokens WHERE user_id = ? ${orderByClause} LIMIT 10 OFFSET ?`,
        [stored_user_id,offset], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  }
}

export async function getAllUserTokens(stored_user_id) {
  const result = await db.query(
    "SELECT * FROM tokens WHERE user_id = $1 ORDER BY id ASC",
    [stored_user_id]
  );
  return result.rows;
}

export async function getAllLogs(stored_user_id) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM logs WHERE user_id = ? ORDER BY id DESC",
      [stored_user_id], 
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  })
}

export async function getLogs(stored_user_id, startDate, endDate, category) {
  let result;
  if (category) {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM logs WHERE user_id = ? AND created_at >= ? AND created_at <= ? AND category ILIKE ? ORDER BY id DESC",
        [stored_user_id, startDate, endDate, category], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  } else {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM logs WHERE user_id = ? AND created_at >= ? AND created_at <= ? ORDER BY id DESC",
        [stored_user_id, startDate, endDate], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  }
  return result.rows;
}

export async function getLogsCursored(stored_user_id,cursor_id) {
  let result;
  if (cursor_id === undefined) {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM logs WHERE user_id = ? ORDER BY id DESC",
        [stored_user_id], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  } else {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM logs WHERE user_id = ? AND id < ? ORDER BY id DESC LIMIT 10",
        [stored_user_id,cursor_id], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  }
}

export async function getVariablesCursored(stored_user_id,cursor_id) {
  let result;
  if (cursor_id === undefined) {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM variables WHERE user_id = ? ORDER BY id ASC",
        [stored_user_id], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  } else {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM variables WHERE user_id = ? AND id > ? ORDER BY id ASC LIMIT 10",
        [stored_user_id,cursor_id], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  }
  return result.rows;
}

export async function getTokensCursored(stored_user_id,cursor_id) {
  let result;
  if (cursor_id === undefined) {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM tokens WHERE user_id = ? ORDER BY id ASC",
        [stored_user_id], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  } else {
    return new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM tokens WHERE user_id = ? AND id > ? ORDER BY id ASC LIMIT 10",
        [stored_user_id,cursor_id], 
        (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
      );
    });
  }
}

//UPDATE
export async function updateUserUsername(id,us) {
  return new Promise((resolve,reject) => {
    connection.query(
      "UPDATE users SET us = ? WHERE id = ?", 
      [us,id],
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function updateUserPassword(id,pw) {
  return new Promise((resolve,reject) => {
    connection.query(
      "UPDATE users SET pw = ? WHERE id = ?", 
      [pw,id],
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function renewUserToken(token) {
  return new Promise((resolve,reject) => {
    connection.query(
      "UPDATE tokens SET updated_at = CURRENT_TIMESTAMP WHERE token = ?", 
      [token],
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function renewUserTokenbyID(token_id) {
  return new Promise((resolve,reject) => {
    connection.query(
      "UPDATE tokens SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", 
      [token_id],
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function updateVariable(id,value) {
  return new Promise((resolve,reject) => {
    connection.query(
      "UPDATE variables SET value = ?, updated_at=CURRENT_TIMESTAMP WHERE id = ?", 
      [value,id],
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function editVariable(id,name,value,type,unit) {
  return new Promise((resolve,reject) => {
    connection.query(
      "UPDATE variables SET variable_name=?, value=?, variable_type=?, unit=?, updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING *", 
      [name,value,type,unit,id],
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}

//DELETE
export async function deleteVariable(id) {
  return new Promise((resolve,reject) => {
    connection.query(
      "DELETE FROM variables WHERE id = ?", 
      [id],
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function deleteVariablesMultiple(ids) {
  const placeholders = ids.map((_, index) => `?`).join(', ');
  const query = `
    DELETE FROM variables
    WHERE id IN (${placeholders})
  `;
  
  // Execute the query
  return new Promise((resolve,reject) => {
    connection.query(query, ids,
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}
export async function deleteTokensMultiple(ids) {
  const placeholders = ids.map((_, index) => `?`).join(', ');
  const query = `
    DELETE FROM tokens
    WHERE id IN (${placeholders})
  `;
  
  // Execute the query
  return new Promise((resolve,reject) => {
    connection.query(query, ids,
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}

export async function deleteToken(id) {
  return new Promise((resolve,reject) => {
    connection.query(
      "DELETE FROM tokens WHERE id = ?", 
      [id],
      (error, results, fields) => {if (error) {reject(error);} else {resolve(results)}}
    );
  });
}