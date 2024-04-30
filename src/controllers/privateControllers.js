import * as MODEL from '../models.js';
import TokenGenerator from 'token-generator';
import * as HASH from '../../hash.js'; //git ignored
import db from '../../configuration/dbConfig.js';
import * as SCHEMA from '../../schema.js';

const tokenGenerator = new TokenGenerator({
  salt: 'your secret ingredient for this magic recipe.',
  timestampMap: 'abcdefghij', // 10 chars array for obfuscation purposes
});

export async function login(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: LOGIN",req.body);}
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
      MODEL.logger("WEB", "account", stored_user_id, stored_user_id, "login");
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

export async function usernameChecker(req, res) {console.log("Debug: USERNAME CHECK",req.body);
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
  let token    = req.body.token;
  let page      = req.body.page;       
  let order_by  = req.body.order_by;   
  let order     = req.body.order;      
  let search    = req.body.search;      
  let target    = req.body.target;      
  let startDate = req.body.startDate;      
  let endDate   = req.body.endDate;
  let category   = req.body.category;

  // Validate the input data
  if ((page===undefined) || (page==="")) {page=1;} else {page=Number(page)} // If page is not specified then force it equal to 1 (As in the overview of the WEB UI)
  if ((order_by===undefined) || (order===undefined)) {order_by="";order="";} // If order is not specified then force it equal to be empty strings, so that later in the SQL query we can make a condition if it is empty or not specified (As in the overview of the WEB UI)
  if ((search===undefined) || (search==="")) {search="";} // If search is not specified then force it equal to an empty string (As in the overview of the WEB UI)
  if ((category===undefined) || (category==="")) {category="";}
  
  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ authenticated: false });} 

  // Get all for the user
  let created_at, AllVariables, AllTokens, AllLogs, cnt_variables, cnt_tokens, cnt_logs;
  try {
    if (target === "variables") {
      AllVariables = await MODEL.getVariables(result[0]['user_id'],order_by,order,(page-1)*10,search);
      cnt_variables = await MODEL.countAllVariables(result[0]['user_id'],search);
    } 
    else {
      AllVariables = await MODEL.getVariables(result[0]['user_id'],"","",(page-1)*10,search);
      cnt_variables = await MODEL.countAllVariables(result[0]['user_id'],search);
    }

    if (target === "tokens") {AllTokens = await MODEL.getUserTokens(result[0]['user_id'],order_by,order,(page-1)*10);} 
    else {AllTokens = await MODEL.getUserTokens(result[0]['user_id'],"","",(page-1)*10);}

    created_at = await MODEL.getUserCreation(result[0]['user_id']);
    created_at = created_at[0]['created_at'];
    
    if (target === "Logs") {
      AllLogs = await MODEL.getLogs(result[0]['user_id'],startDate, endDate, category);
      cnt_logs = await MODEL.countAllLogs(result[0]['user_id'], startDate, endDate, category);
    } 
    else {
      AllLogs = await MODEL.getAllLogs(result[0]['user_id']);
      cnt_logs = await MODEL.countAllLogs(result[0]['user_id']);
    }

    cnt_tokens = await MODEL.countAllTokens(result[0]['user_id']);

    // console.log(cnt_variables, cnt_tokens, cnt_logs);

  return res.json({ created_at: created_at,
                    logs: AllLogs.slice((page-1)*10,page*10), //previously .slice(0,10)
                    cnt_logs: cnt_logs[0].total_count,
                    variables: AllVariables, //previously .slice(0,10)
                    cnt_variables: cnt_variables[0].total_count,
                    tokens: AllTokens, //previously .slice(0,10)
                    cnt_tokens: cnt_tokens[0].total_count
                  });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  } 
}

export async function getLogs(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: GET LOGS_CURSORED",req.body);}
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

export async function getVariables(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: GET VARS_CURSORED",req.body);}
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

  // Get variables for the user
  try { 
    const Variables = await MODEL.getVariablesCursored(result[0]['user_id'], cursor);
    return res.json({ variables: Variables });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function getTokens(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: GET TOKS_CURSORED",req.body);}
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

  // Get tokens for the user
  try { 
    const Tokens = await MODEL.getTokensCursored(result[0]['user_id'], cursor);
    return res.json({ tokens: Tokens });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function editVariable(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: EDIT VARIABLE",req.body);}
  let variable_id    = req.body.variable_id;
  let variable_name  = req.body.variable_name;
  let variable_value = req.body.variable_value;
  let variable_type  = req.body.variable_type;
  let variable_unit  = req.body.variable_unit;
  let token          = req.body.token;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ error: "Unauthorized" });} 

  // Validate Data
  if (SCHEMA.DetectUndefined(variable_id,variable_name)) {
    let nullVars = [];
    if (SCHEMA.DetectUndefined(variable_id))   {nullVars.push("variable_id");}
    if (SCHEMA.DetectUndefined(variable_name)) {nullVars.push("variable_name");}

    return res.status(401).json({ error: "Unauthorized" }) // "All fields must be specified: "
  }
  if (!SCHEMA.CheckVariableIf("numeric",variable_id)) {
    return res.status(401).json({ error: "Unauthorized" }); // "variable_id must be numeric."
  }
  
  if ((variable_value === undefined) || (variable_value === "")) {variable_value="0";}
  if (variable_unit === undefined)  {variable_unit="";}
  if ((variable_type)) {
    if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
      if (!SCHEMA.CheckVariableIf(variable_type, variable_value)) {
        return res.status(451).json({ error: "Mismatch of type and value" }); //Expectation of type mismatch
      } 
    } else {
      return res.status(401).json({ error: "Unauthorized" }); // Expected types are only numeric, text, or boolean
    }
  } else {variable_type="text";}

  // Check if the user really owns the variable 
  const variable_found = await MODEL.findVariableNameByID(variable_id, result[0]['user_id']);
  if (variable_found.length === 0) {
    return res.status(401).json({ error: "Very very very Unauthorized" });
  }

  // Check if user already has the variable name
  const variable_name_founds = await MODEL.findVariableName(variable_name, result[0]['user_id']);
  if (variable_name_founds.length > 0) {
    console.log(variable_name_founds);
    let ToReturn = false;
    variable_name_founds.forEach((variable_name_found) => {
      if (variable_name_found.id != variable_id) {
        console.log("Used");
        ToReturn = true;
        return
      }
    });
    if (ToReturn) {return res.status(422).json({ error: "Unauthorized" });} //This name is used in other variables
    console.log("not returned")
  }
  // Edit the variable
  try { 
    const variable = await MODEL.editVariable(variable_id,variable_name,variable_value,variable_type,variable_unit);
    MODEL.logger("WEB", "variables", result[0]['user_id'], variable_id, "edit");
    return res.json({ msg: "Success" , variable: variable});
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function deleteVariable(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: DELETE VARIABLE",req.body);}
  let variable_id    = req.body.variable_id;
  let token          = req.body.token;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ error: "Unauthorized" });} 

  // Validate Data
  if (SCHEMA.DetectUndefined(variable_id)) {
    let nullVars = [];
    if (SCHEMA.DetectUndefined(variable_id)) {nullVars.push("variable_id");}

    return res.status(401).json({ error: "Unauthorized" }) // "All fields must be specified: "
  }
  if (!SCHEMA.CheckVariableIf("numeric",variable_id)) {
    return res.status(401).json({ error: "Unauthorized" }); // "variable_id must be numeric."
  }
  
  // Check if the user really owns the variable 
  const variable_found = await MODEL.findVariableNameByID(variable_id, result[0]['user_id']);
  if (variable_found.length === 0) {
    return res.status(401).json({ error: "Very very very Unauthorized" });
  }

  // Delete the variable
  try { 
    const variable = await MODEL.deleteVariable(variable_id);
    MODEL.logger("WEB", "variables", result[0]['user_id'], variable_id, "delete");
    return res.json({ msg: "Success" , variable: variable});
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function addVariable(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: ADDD VARIABLE",req.body);}
  let variable_name  = req.body.variable_name;
  let variable_value = req.body.variable_value;
  let variable_type  = req.body.variable_type;
  let variable_unit  = req.body.variable_unit;
  let token          = req.body.token;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ error: "Unauthorized" });} 

  // Validate Data
  if (variable_name === "") {variable_name = undefined;} 
  if (SCHEMA.DetectUndefined(variable_name)) {
    let nullVars = [];
    if (SCHEMA.DetectUndefined(variable_name)) {nullVars.push("variable_name");}

    return res.status(452).json({ error: "Unauthorized" }) // "All fields must be specified: "
  }
  
  if ((variable_value === undefined) || (variable_value === "")) {variable_value="0";}
  if (variable_unit === undefined)  {variable_unit="";}
  if ((variable_type)) {
    if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
      if (!SCHEMA.CheckVariableIf(variable_type, variable_value)) {
        return res.status(451).json({ error: "Mismatch of type and value" }); //Expectation of type mismatch
      } 
    } else {
      return res.status(401).json({ error: "Unauthorized" }); // Expected types are only numeric, text, or boolean
    }
  } else {variable_type="text";}

  // Check if user already has the variable name
  const variable_name_founds = await MODEL.findVariableName(variable_name, result[0]['user_id']);
  if (variable_name_founds.length > 0) {
    return res.status(422).json({ error: "Unauthorized" }); //This name is used in other variables
  }
  // Add the variable
  try { 
    const variable = await MODEL.insertVariableName(result[0]['user_id'], variable_name, variable_value, variable_type, variable_unit);
    MODEL.logger("WEB", "variables", result[0]['user_id'], variable[0]['id'], "add");
    return res.json({ msg: "Success" , variable: variable});
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function deleteVariablesMoreThan1(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: DELETE MULTIPLE VARIABLES",req.body);}
  let variable_ids = req.body.variable_ids;
  let token        = req.body.token;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ error: "Unauthorized" });} 

  // Validate Data
  if ((variable_ids === undefined) || (variable_ids === "")) {return res.status(401).json({ error: "Unauthorized" });}
  if (typeof variable_ids !== 'object') {return res.status(401).json({ error: "Unauthorized" });}
  try {
    let ToReturn = false;
    variable_ids.forEach(variable_id => {
      if (!SCHEMA.CheckVariableIf("numeric",variable_id)) {
        ToReturn = true; return// "variable_id must be numeric."
      }
    });
    if (ToReturn === true) {return res.status(401).json({ error: "Unauthorized" });}
  } catch {
    {return res.status(401).json({ error: "Unauthorized" });}
  }
  
  // Check if the user really owns the variables 
  try {
    for (const variable_id of variable_ids) {
      const variable_found = await MODEL.findVariableNameByID(variable_id, result[0]['user_id']);
      if (variable_found.length === 0) {
        return res.status(401).json({ error: "Very very very Unauthorized" });
      }
    }
  } catch {
    {return res.status(401).json({ error: "Unauthorized4" });}
  }

  // Delete the variables
  try { 
    await MODEL.deleteVariablesMultiple(variable_ids);
    for (const variable_id of variable_ids) {
      MODEL.logger("WEB", "variables", result[0]['user_id'], variable_id, "delete");
    }
    return res.json({ msg: "Success" });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function renewToken(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: RENEW TOKEN",req.body);}
  let token  = req.body.token;
  let token_id = req.body.token_id;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ authenticated: false });} 

  // Validate Data
  if (!SCHEMA.CheckVariableIf("numeric",token_id)) {
    return res.status(401).json({ error: "Unauthorized" }); // "variable_id must be numeric."
  }

  // Renew the token for the user
  try { 
    await MODEL.renewUserTokenbyID(token_id);
    MODEL.logger("WEB", "tokens", result[0]['user_id'], token_id, "renew");
    return res.json({ msg: "Success" });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function deleteToken(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: RENEW TOKEN",req.body);}
  let token  = req.body.token;
  let token_id = req.body.token_id;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ authenticated: false });} 

  // Validate Data
  if (!SCHEMA.CheckVariableIf("numeric",token_id)) {
    return res.status(401).json({ error: "Unauthorized" }); // "variable_id must be numeric."
  }

  // Renew the token for the user
  try { 
    await MODEL.deleteToken(token_id);
    MODEL.logger("WEB", "tokens", result[0]['user_id'], token_id, "delete");
    return res.json({ msg: "Success" });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function addToken(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: NEW TOKEN",req.body);}
  let token  = req.body.token;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ authenticated: false });} 

  // Add a new generated token for the user
  try { 
    const token = await MODEL.insertGeneratedToken(result[0]['user_id']);
    MODEL.logger("WEB", "tokens", result[0]['user_id'], token[0]['id'], "new");
    return res.json({ msg: "Success" });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function deleteTokensMoreThan1(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: DELETE MULTIPLE TOKENS",req.body);}
  let token_ids = req.body.token_ids;
  let token     = req.body.token;

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ error: "Unauthorized" });} 

  // Validate Data
  if (SCHEMA.DetectUndefined(token_ids)) {return res.status(401).json({ error: "Unauthorized" });}
  if (typeof token_ids !== 'object') {return res.status(401).json({ error: "Unauthorized" });}
  try {
    for (const token_id of token_ids) {
      if (!SCHEMA.CheckVariableIf("numeric",token_id)) {
        return res.status(401).json({ error: "Unauthorized" }); // "token_id must be numeric."
      }
    }
  } catch {
    {return res.status(401).json({ error: "Unauthorized" });}
  }
  
  // Check if the user really owns the tokens 
  try {
    for (const token_id of token_ids) {
      const token_found = await MODEL.selectTokenByID(token_id, result[0]['user_id']);
      if (token_found.length === 0) {
        return res.status(401).json({ error: "Very very very Unauthorized" });
      }
    }
  } catch {
    {return res.status(401).json({ error: "Unauthorized" });}
  }

  // Delete the token
  try { 
    await MODEL.deleteTokensMultiple(token_ids);;
    for (const token_id of token_ids) {
      MODEL.logger("WEB", "tokens", result[0]['user_id'], token_id, "delete");
    }
    return res.json({ msg: "Success" });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function changeUsername(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: CHANGE USERNAME",req.body);}
  const token           = req.body.token;
  const new_username    = req.body['new_username'];
  const password_input  = req.body['password_input'];

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (result.length === 0) {return res.status(401).json({ error: "Unauthorized" });} 

  // Validate the input
  if (SCHEMA.DetectUndefined(new_username)) {
    let nullVars = [];
    if (SCHEMA.DetectUndefined(new_username)) {nullVars.push("new_username");}

    return res.status(451).json({ error: "Please enter a username."});
  }

  // Get the user credentials
  const stored_user = await MODEL.selectUserByID(result[0]['user_id']);
  if ((stored_user.length < 1)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if Password is matched with the stored
  const stored_user_id = stored_user[0]['id'];
  const username = stored_user[0]['us'];
  const stored_user_pw = stored_user[0]['pw'];
  try {
    const passwordMatch = await HASH.comparePassword(password_input, stored_user_pw);
    if (!passwordMatch) {
      return res.status(452).json({ error: "Wrong Password." });
    }
  } catch (ComparingError) { console.log(ComparingError);
    return res.status(452).json({ error: "Wrong Password"  });
  }

  //Validate the new username
  try {
    await SCHEMA.validateUserData(new_username, password_input);
  } catch(validationError) {
    return res.status(validationError["status"]).json({ error: validationError });
  }

  // Check if the usernames are the same
  if (new_username === username) {
    return res.status(453).json({ error: "New username cannot be the same as the previous username." });
  }

  // Check if the new username is already used
  const stored_user2 = await MODEL.selectUserByUsername(new_username);
  if ((stored_user2.length > 0)) {
    return res.status(453).json({ error: "The new username is already used." });
  }

  // Update the Username
  try {
    await MODEL.updateUserUsername(stored_user_id,new_username);
    MODEL.logger("WEB", "account", result[0]['user_id'], result[0]['user_id'], "changeus");
    return res.json({ msg: "Success" });
  } catch (SQLError) { console.log(SQLError);
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function changePassword(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: CHANGE PASSWORD",req.body);}
  const token           = req.body.token;
  const new_password    = req.body['new_password'];
  const password_input  = req.body['password_input'];

  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (result.length === 0) {return res.status(401).json({ error: "Unauthorized" });} 

  // Validate the input
  if (SCHEMA.DetectUndefined(new_password)) {
    let nullVars = [];
    if (SCHEMA.DetectUndefined(new_password)) {nullVars.push("new_password");}

    return res.status(451).json({ error: "Please enter a password."});
  }

  // Get the user credentials
  const stored_user = await MODEL.selectUserByID(result[0]['user_id']);
  if ((stored_user.length < 1)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if Password is matched with the stored
  const stored_user_id = stored_user[0]['id'];
  const username = stored_user[0]['us'];
  const stored_user_pw = stored_user[0]['pw'];
  try {
    const passwordMatch = await HASH.comparePassword(password_input, stored_user_pw);
    if (!passwordMatch) {
      return res.status(452).json({ error: "Wrong Password." });
    }
  } catch (ComparingError) { console.log(ComparingError);
    return res.status(452).json({ error: "Wrong Password"  });
  }

  //Validate the new username
  try {
    await SCHEMA.validateUserData(username, new_password);
  } catch(validationError) {
    return res.status(validationError["status"]).json({ error: validationError });
  }

  // Hash the password
  let hashedPassword;
  try {
    hashedPassword = await HASH.hashPassword(new_password);
  } catch (HashingError) { //console.log(HashingError);
    return res.status(400).json({ error: "Error at password hashing" });
  }

  // Check if Password is matched with the stored
  try {
    const passwordMatch = await HASH.comparePassword(new_password, stored_user_pw);
    if (passwordMatch) {
      return res.status(409).json({ error: "New password cannot be the same as the previous password." });
    }
  } catch (ComparingError) { console.log(ComparingError);
    return res.status(409).json({ error: "Password comparing error" });
  }

  // Update the password
  try {
    await MODEL.updateUserPassword(stored_user_id, hashedPassword);
    MODEL.logger("WEB", "account", stored_user_id, stored_user_id, "changepwd");
    return res.json({msg: "Success"});
  } catch (SQLError) { console.log(SQLError);
    return res.status(409).json({ error: "SQL error changing password" });
  }
}