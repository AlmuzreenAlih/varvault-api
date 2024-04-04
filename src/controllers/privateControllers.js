import * as MODEL from '../models.js';
import TokenGenerator from 'token-generator';
import * as HASH from '../../hash.js'; //git ignored
import db from '../../configuration/dbConfig.js';

const tokenGenerator = new TokenGenerator({
  salt: 'your secret ingredient for this magic recipe.',
  timestampMap: 'abcdefghij', // 10 chars array for obfuscation purposes
});

export async function login(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: LOGIN");}
    let username    =   req.body.username;
    let password    =   req.body.password;
  
    // Check if username is in the database
    let stored_user;
    try {
      stored_user = await MODEL.selectUserByUsername(username);
      if ((stored_user.length < 1)) {return res.status(409).json({ error: "Wrong username/password" });}
    } catch (SQLError) {console.log(SQLError); 
      return res.status(409).json({ error: "SQL Error" });
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

    // Insert the browser token
    var token = tokenGenerator.generate();
    try {
      MODEL.insertGeneratedBrowserToken(stored_user_id, token);
      MODEL.logger("WEB", "account", stored_user_id, stored_user_id, "register");
    } catch (SQLError) { console.log(SQLError);
      return res.status(400).json({ error: "SQL Error" });
    }
    
    return res.json({authenticated: true, token: token});
}

export async function register(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: REGISTER",req.body);}
  let username    =   req.body.username;
  let password    =   req.body.password;

  // Check if the username already exists
  try {
    if ((await MODEL.selectUserByUsername(username)).length > 0) {
      return res.status(409).json({ error: "Username already registered" });
    }
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  
  //Hash the password
  let hashedPassword;
  try {
    hashedPassword = await HASH.hashPassword(password);
  } catch (HashingError) { //console.log(HashingError);
    return res.status(400).json({ error: "Error at password hashing" });
  }

  // Insert the user
  let user;
  try {
    user = await MODEL.insertUser(username, hashedPassword);
  } catch (SQLError) { console.log(SQLError);
    return res.status(400).json({ error: "SQL Error" });
  }

  // Insert the browser token
  var token = tokenGenerator.generate();
  try {
    MODEL.insertGeneratedBrowserToken(user[0].id, token);
    MODEL.logger("WEB", "account", user[0].id, user[0].id, "register");
  } catch (SQLError) { console.log(SQLError);
    return res.status(400).json({ error: "SQL Error" });
  }

  return res.json({authenticated: true, token: token});
}

export async function usernameChecker(req, res) {
    let username    =   req.body.username;

    // Check if the username already exists
    try {
      if ((await MODEL.selectUserByUsername(username)).length > 0) {
        return res.status(409).json({ availability: false });
      }
    } catch (SQLError) {console.log(SQLError); 
      return res.status(409).json({ error: "SQL Error" });
    }

    return res.json({ availability: true });

}

export async function auth(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: AUTH",req.body);}
  let token = req.body.token;

  // Check if the Browser Token exists
  let result;
  try {
    result = await MODEL.findBrowserToken(token);
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length > 0) {
    return res.json({ authenticated: true, msg: "token good"});
  } else {
    return res.status(401).json({ authenticated: false });
  }
}

export async function getAll(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: GET ALL",req.body);}
  let token  = req.body.token;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ authenticated: false });} 

  // Get all for the user
  let AllVariables, AllTokens, AllLogs;
  try {
    AllVariables = await MODEL.getAllVariables(result[0]['user_id']);
    AllTokens = await MODEL.getAllUserTokens(result[0]['user_id']);
    AllLogs = await MODEL.getLogsCursored(result[0]['user_id']);
  // MODEL.logger("WEB", "account", result.rows[0]['user_id'], result.rows[0]['user_id'], "login");
  return res.json({ created_at: "July 15, 2023",
                    logs: AllLogs.slice(0,10),
                    cnt_logs: AllLogs.length,
                    variables: AllVariables, 
                    cnt_variables: AllVariables.length,
                    tokens: AllTokens,
                    cnt_tokens: AllTokens.length
                  });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  } 
}

export async function getLogs(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: GET VARS_C",req.body);}
  let token  = req.body.token;
  let cursor = req.body.cursor;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ authenticated: false });} 

  // Get logs for the user
  try { 
    const Logs = await MODEL.getLogsCursored(result[0]['user_id'], cursor);
    return res.json({ logs: Logs });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}