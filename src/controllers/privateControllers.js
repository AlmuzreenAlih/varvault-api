import * as MODEL from '../models.js';
import TokenGenerator from 'token-generator';
import * as HASH from '../../hash.js'; //git ignored
import db from '../../configuration/dbConfig.js';
import * as SCHEMA from '../../schema.js';

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
  let token    = req.body.token;
  let page     = req.body.page;       
  let order_by = req.body.order_by;   
  let order    = req.body.order;      

  // Validate the input data
  if ((page===undefined) || (page==="")) {page=1;} else {page=Number(page)} // If page is not specified then force it equal to 1 (As in the overview of the WEB UI)
  if ((order_by===undefined) || (order===undefined)) {order_by="";order="";} // If order is not specified then force it equal to be empty strings, so that later in the SQL query we can make a condition if it is empty or not specified (As in the overview of the WEB UI)
  
  // Check if the Browser Token exists
  let result; 
  try {
    result = await MODEL.findBrowserToken(token); 
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
  if (result.length === 0) {return res.status(401).json({ authenticated: false });} 

  // Get all for the user
  let AllVariables, AllTokens, AllLogs, cnt_variables;
  try {
    AllVariables = await MODEL.getVariables(result[0]['user_id'],order_by,order,(page-1)*10);
    AllTokens = await MODEL.getAllUserTokens(result[0]['user_id']);
    AllLogs = await MODEL.getAllLogs(result[0]['user_id']);
    cnt_variables = await MODEL.countAllVariables(result[0]['user_id']);
    // console.log(cnt_variables);
  // MODEL.logger("WEB", "account", result.rows[0]['user_id'], result.rows[0]['user_id'], "login");
  return res.json({ created_at: "July 15, 2023",
                    logs: AllLogs.slice((page-1)*10,page*10), //previously .slice(0,10)
                    cnt_logs: AllLogs.length,
                    variables: AllVariables, //previously .slice(0,10)
                    cnt_variables: cnt_variables[0].total_count,
                    tokens: AllTokens.slice((page-1)*10,page*10), //previously .slice(0,10)
                    cnt_tokens: AllTokens.length
                  });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  } 
}

export async function getLogs(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: GET LOGS_C",req.body);}
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

export async function getVariables(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: GET VARS_C",req.body);}
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

export async function getTokens(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: GET TOKS_C",req.body);}
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

export async function editVariable(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: EDIT VARI",req.body);}
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
    return res.json({ msg: "Success" , variable: variable});
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function deleteVariable(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: DELE VARI",req.body);}
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
    return res.json({ msg: "Success" , variable: variable});
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function addVariable(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: ADDD VARI",req.body);}
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
  // Edit the variable
  try { 
    const variable = await MODEL.insertVariableName(result[0]['user_id'], variable_name, variable_value, variable_type, variable_unit);
    return res.json({ msg: "Success" , variable: variable});
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}

export async function deleteVariablesMoreThan1(req, res) { if (Boolean(process.env.DEBUGGING)) {console.log("Debug: DELE VARI MULT",req.body);}
  let variable_ids   = req.body.variable_ids;
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

  console.log(variable_ids,typeof(variable_ids))
  // Delete the variable
  try { 
    await MODEL.deleteVariablesMultiple(variable_ids);;
    return res.json({ msg: "Success" });
  } catch (SQLError) {console.log(SQLError); 
    return res.status(409).json({ error: "SQL Error" });
  }
}