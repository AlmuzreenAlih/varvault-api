import * as MODEL from '../models.js';
import * as HASH from '../../hash.js'; //git ignored
import * as SCHEMA from '../../schema.js';

export async function addVariable(req, res) {
  // Get the user's input
  // Extract the Basic Auth Credentials from the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Specify username and password' });
  }
  const encodedCredentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');

  const [username, password] = decodedCredentials.split(':'); //Extract username and password parts
  const variable_name        = req.body.variable_name;
  const value                = req.body.value;
  let variable_type          = req.body.variable_type;
  let unit                   = req.body.unit;

  // Validate Data
  if (SCHEMA.DetectUndefined(username,password,variable_name,value)) {
    let nullVars = [];
    if (username      === undefined) {nullVars.push("username");}
    if (password      === undefined) {nullVars.push("password");}
    if (variable_name === undefined) {nullVars.push("variable_name");}
    if (value         === undefined) {nullVars.push("value");}

    return res.status(409).json({ error: "These fields must be specified: " + nullVars.join(',') });
  }
  if (variable_type) {
    if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
      if (!SCHEMA.CheckVariableIf(variable_type, value)) {
        return res.status(409).json({ error: "Expected " + variable_type });
      } 
    } else {
      return res.status(409).json({ error: "Expected types are only numeric, text, or boolean" });
    }
  } else {variable_type="text";}
  if (unit === undefined) {unit="";}

  // Check if username is in the database
  const stored_user = await MODEL.selectUserByUsername(username);
  if ((stored_user.length < 1)) {
    return res.status(401).json({ error: "Wrong username/password" });
  }

  // Check if Password is matched with the stored
  const stored_user_id = stored_user[0]['id'];
  const stored_user_pw = stored_user[0]['pw'];
  const passwordMatch = await HASH.comparePassword(password, stored_user_pw);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Wrong username/password." });
  }

  // Check if user already has the variable name
  const variable_name_found = await MODEL.findVariableName(variable_name,stored_user_id);
  if (variable_name_found.length > 0) {
    return res.status(409).json({ error: "You already have used that variable name, try another." });
  }

  // Insert the variable name
  try {
    await MODEL.insertVariableName(stored_user_id, variable_name, value, variable_type, unit); 
    return res.json({ message: "Variable is added", 
                      variable: variable_name, 
                      value: value,
                      type: variable_type,
                      unit: unit
                    });
  } catch (SQLError) { console.log(SQLError);
    return res.status(409).json({ error: "SQL Error inserting variable name." });
  }
}

export async function addVariableViaToken(req, res) {
  // Get the user's input
  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1]; // Extract the token part
  const variable_name   =   req.body.variable_name;
  const value           =   req.body.value;
  let variable_type     =   req.body.variable_type;
  let unit              =   req.body.unit;

  // Validate Data
  if (SCHEMA.DetectUndefined(token,variable_name,value)) {
    let nullVars = [];
    if (token === undefined) {nullVars.push("token");}
    if (variable_name === undefined) {nullVars.push("variable_name");}
    if (value         === undefined) {nullVars.push("value");}

    return res.status(409).json({ error: "All fields must be specified: " + nullVars.join(',') });
  }
  if (variable_type) {
    if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
      if (!SCHEMA.CheckVariableIf(variable_type, value)) {
        return res.status(409).json({ error: "Expected " + variable_type });
      } 
    } else {
      return res.status(409).json({ error: "Expected types are only numeric, text, or boolean" });
    }
  } else {variable_type="text";}
  if (unit === undefined) {unit="";}

  // Check if token is in the database
  const stored_token = await MODEL.selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }

  // Check if user already has the variable name
  const stored_token_user_id = stored_token[0]['user_id'];
  const variable_name_found = await MODEL.findVariableName(variable_name,stored_token_user_id);
  if (variable_name_found.length > 0) {
    return res.status(409).json({ error: "You already have used that variable name, try another." });
  }

  // Insert the variable name
  try {
    await MODEL.insertVariableName(stored_token_user_id, variable_name, value, variable_type, unit); 
    return res.json({ message: "Variable is added", variable: variable_name, value: value });
  } catch (SQLError) { console.log(SQLError);
    return res.status(409).json({ error: "SQL Error inserting variable name." });
  }
}

export async function updateVariableViaToken(req, res) {
  // Get the user's input
  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token should be specified' });
  }
  const token = authHeader.split(' ')[1]; // Extract the token part

  const variable_name   =   req.body.variable_name;
  const value           =   req.body.value;

  // Validate Data
  if (SCHEMA.DetectUndefined(token,variable_name,value)) {
    let nullVars = [];
    if (token         === undefined) {nullVars.push("token");}
    if (variable_name === undefined) {nullVars.push("variable_name");}
    if (value         === undefined) {nullVars.push("value");}

    return res.status(409).json({ error: "All fields must be specified: " + nullVars.join(',') });
  }

  // Check if token is in the database
  const stored_token = await MODEL.selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }

  // Check if user has the variable name
  const stored_token_user_id = stored_token[0]['user_id'];
  const variable_name_found = await MODEL.findVariableName(variable_name,stored_token_user_id);
  if (variable_name_found.length < 1) {
    return res.status(409).json({ error: "Variable name not found" });
  }

  // Check if value input matches the variable type
  const variable_type = variable_name_found[0]["variable_type"];
  if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
    if (!SCHEMA.CheckVariableIf(variable_type, value)) {
      return res.status(409).json({ error: "Expected " + variable_type });
    } 
  }

  // SQL Update the variable
  const variable_id = variable_name_found[0]["id"];
  await MODEL.updateVariable(variable_id,value);
  return res.json({ message: "Variable is updated", variable: variable_name, value: value });
}

export async function deleteVariable(req, res) {
  // Get the user inputs
  // Extract the Basic Auth Credentials from the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Specify username and password' });
  }
  const encodedCredentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
  const [username, password] = decodedCredentials.split(':'); //Extract username and password parts
  const variable_name   =   req.body.variable_name;

  // Check if username is in the database
  const stored_user = await MODEL.selectUserByUsername(username);
  if ((stored_user.length < 1)) {
    return res.status(401).json({ error: "Wrong username/password" });
  }

  // Check if Password is matched with the stored
  const stored_user_id = stored_user[0]['id'];
  const stored_user_pw = stored_user[0]['pw'];
  const passwordMatch = await HASH.comparePassword(password, stored_user_pw);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Wrong username/password." });
  }

  // Check if user has the variable name
  const variable_name_found = await MODEL.findVariableName(variable_name,stored_user_id);
  if (variable_name_found.length < 1) {
    return res.status(409).json({ error: "Variable name not found" });
  }

  // SQL DELETE the variable
  const variable_id = variable_name_found[0]["id"];
  await MODEL.deleteVariable(variable_id);
  return res.json({ message: "Variable "+ variable_name + " is deleted" });
}

export async function deleteVariableViaToken(req, res) {
  // Get the user's input
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token should be specified' });
  }
  const token = authHeader.split(' ')[1]; // Extract the token part
  const variable_name   =   req.body.variable_name;

  // Validate Data
  if (SCHEMA.DetectUndefined(token,variable_name)) {
    let nullVars = [];
    if (token === undefined) {nullVars.push("token");}
    if (variable_name === undefined) {nullVars.push("variable_name");}

    return res.status(409).json({ error: "All fields must be specified: " + nullVars.join(',') });
  }

  // Check if token is in the database
  const stored_token = await MODEL.selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }

  // Check if user has the variable name
  const stored_token_user_id = stored_token[0]['user_id'];
  const variable_name_found = await MODEL.findVariableName(variable_name,stored_token_user_id);
  if (variable_name_found.length < 1) {
    return res.status(409).json({ error: "Variable name not found" });
  }

  // SQL DELETE the variable
  const variable_id = variable_name_found[0]["id"];
  await MODEL.deleteVariable(variable_id);
  return res.json({ message: "Variable "+ variable_name + " is deleted" });
}

export async function readVariable(req, res) {
  //Get the user's input
  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token should be specified' });
  }
  const token = authHeader.split(' ')[1]; // Extract the token part
  const variable_name = req.body.variable_name;
  
  // Validate Data
  if (SCHEMA.DetectUndefined(token,variable_name)) {
    let nullVars = [];
    if (token === undefined) {nullVars.push("token");}
    if (variable_name === undefined) {nullVars.push("variable_name");}

    return res.status(409).json({ error: "All fields must be specified: " + nullVars.join(',') });
  }
  
  // Check if token is in the database
  const stored_token = await MODEL.selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }

  // Check if variable name exists
  if (variable_name !== undefined) {
    const stored_token_user_id = stored_token[0]['user_id'];
    const variable_name_found = await MODEL.findVariableName(variable_name, stored_token_user_id);
    if (variable_name_found.length < 1) {
      return res.status(409).json({ error: "Variable name not found" });
    }
    return res.json({ [variable_name] : variable_name_found[0]["value"], 
                      type : variable_name_found[0]["variable_type"], 
                      last_update: variable_name_found[0]["updated_at"],
                      unit: variable_name_found[0]["unit"]});
  }
}

export async function readVariableViaToken(req, res) {
  // Get the user's input
  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token should be specified' });
  }
  const token = authHeader.split(' ')[1]; // Extract the token part

  // Check if token is in the database
  const stored_token = await MODEL.selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }

  const stored_token_user_id = stored_token[0]['user_id'];

  // Get all variables for the user
  if (req.params.format == "format1") {
    const AllVariables = await MODEL.getAllVariables(stored_token_user_id)
    return res.json({ variables: AllVariables });
  } else if (req.params.format == "format2") {
    const AllVariables = await MODEL.getAllVariables(stored_token_user_id)
    var AllVariablesObj = {};
    AllVariables.forEach(element => {
      AllVariablesObj[element.variable_name] = element.value;
    });
    
    return res.json({ variables: AllVariablesObj });
  } else {return res.json({ error: "formats are only format1 and format2" });}
}