import * as MODEL from '../models.js';
import TokenGenerator from 'token-generator';
import * as HASH from '../../hash.js'; //git ignored
import db from '../../configuration/dbConfig.js';

const tokenGenerator = new TokenGenerator({
  salt: 'your secret ingredient for this magic recipe.',
  timestampMap: 'abcdefghij', // 10 chars array for obfuscation purposes
});

export async function login(req, res) { if (process.env.PG_USER) {console.log("Debug: LOGIN");}
    let username    =   req.body.username;
    let password    =   req.body.password;
  
    // Check if username is in the database
    const stored_user = await MODEL.selectUserByUsername(username);
    if ((stored_user.length < 1)) {
      return res.status(409).json({ error: "Wrong username/password" });
    }

    // Check if Password is matched with the stored
    const stored_user_id = stored_user[0]['id'];
    const stored_user_pw = stored_user[0]['pw'];
    try {
      const passwordMatch = await HASH.comparePassword(password, stored_user_pw);
      if (!passwordMatch) {
        return res.status(409).json({ error: "Wrong username/password." });
      }
    } catch (ComparingError) { console.log(ComparingError);
      return res.status(409).json({ error: "Password comparing error" });
    }
    var token = tokenGenerator.generate();
    db.query(
      "INSERT INTO browser_tokens (user_id, token) VALUES ($1, $2)",
      [stored_user_id, token]
    );
    return res.json({authenticated: true, token: token});
}

export async function register(req, res) { if (process.env.PG_USER) {console.log("Debug: REGISTER",req.body);}
  let username    =   req.body.username;
  let password    =   req.body.password;

  // Check if the username already exists
  if ((await MODEL.selectUserByUsername(username)).length > 0) {
    return res.status(409).json({ error: "Username already registered" });
  }
  
  //Hash the password
  let hashedPassword;
  try {
    hashedPassword = await HASH.hashPassword(password);
  } catch (HashingError) { //console.log(HashingError);
    return res.status(400).json({ error: "Error at password hashing" });
  }

  //Insert the user
  let user;
  try {
    user = await MODEL.insertUser(username, hashedPassword);
  } catch (SQLError) { console.log(SQLError);
    return res.status(400).json({ error: "SQL Error registering user" });
  }

  var token = tokenGenerator.generate();
  db.query(
    "INSERT INTO browser_tokens (user_id, token) VALUES ($1, $2)",
    [user[0].id, token]
  );
  return res.json({authenticated: true, token: token});
}

export async function usernameChecker(req, res) {
    let username    =   req.body.username;

    // Check if the username already exists
    if ((await MODEL.selectUserByUsername(username)).length > 0) {
      return res.status(409).json({ availability: false });
    }

    return res.json({ availability: true });

}

export async function auth(req, res) { if (process.env.PG_USER) {console.log("Debug: AUTH",req.body);}
  let token = req.body.token;

  const result = await MODEL.findBrowserToken(token);
  
  if (result.length > 0) {
    return res.json({ authenticated: true, msg: "token good"});
  } else {
    return res.status(401).json({ authenticated: false });
  }
}

export async function getAll(req, res) { if (process.env.PG_USER) {console.log("Debug: GET ALL",req.body);}
  let token  = req.body.token;

  const result = await db.query(
    "SELECT * FROM browser_tokens WHERE token = $1", 
    [token]);
  
  if (result.rows.length === 0) {
    return res.status(401).json({ authenticated: false });
  } 

  // Get all for the user
  const AllVariables = await MODEL.getAllVariables(result.rows[0]['user_id']);
  const AllTokens = await MODEL.getAllUserTokens(result.rows[0]['user_id']);
  return res.json({ created_at: "July 15, 2023",
                    logs: AllTokens,
                    variables: AllVariables, 
                    tokens: AllTokens });
}