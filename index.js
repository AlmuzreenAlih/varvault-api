import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";

import { selectUserByUsername, insertUser, insertGeneratedToken,
         findVariableName, insertVariableName, selectToken,
         updateVariable } from './dbops.js';
import { validateUserData, DetectUndefined, CheckVariableIf } from './validator.js';
import { comparePassword, hashPassword } from './hash.js'; // git-ignored due to security reason

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URI
const supabaseKey = process.env.API_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchUsers() {
  try {
    const {data,error} = await supabase.from("users").select("*");
    if (error) {throw error}
    console.log(data)
    return data
  } catch (error) {
    console.error('Error fetching users:', error.message)
    return null
  }
}

// fetchUsers()

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    res.render("index.ejs", { content: "API Response." });
  });

function isValidUsername(username) {
  if (username.length < 6) {return false;}
  const regex = /^[a-zA-Z0-9_.]+$/;
  return regex.test(username);
}

app.post("/register", async (req, res) => {
    let username    =   req.body.username;
    let password    =   req.body.password;

    // Check if the username already exists
    if ((await selectUserByUsername(username)).length > 0) {
      return res.status(409).json({ error: "Username already registered" });
    }

    //Validate the user inputs
    try {
      await validateUserData(username, password);
    } catch(validationError) { //console.log(validationError);
      return res.status(validationError["status"]).json({ error: validationError });
    }
    
    //Hash the password
    try {
      const hashedPassword = await hashPassword(password);
      try {
        await insertUser(username, hashedPassword);
        res.json({message: "Registration Successful for " + username + "."});
      } catch (SQLError) { console.log(SQLError);
        return res.status(400).json({ error: "SQL Error registering user" });
      }
    } catch (HashingError) { console.log(HashingError);
      return res.status(400).json({ error: "Error at password hashing" });
    }
});

app.post("/gen-token", async (req, res) => {
    const username        =   req.body.username;
    const password_input  =   req.body.password;

    // Check if username is in the database
    const stored_user = await selectUserByUsername(username);
    if ((stored_user.length < 1)) {
      return res.status(409).json({ error: "Wrong username/password" });
    }

    // Check if Password is matched with the stored
    const stored_user_id = stored_user[0]['id'];
    const stored_user_pw = stored_user[0]['pw'];
    try {
      const passwordMatch = await comparePassword(password_input, stored_user_pw);
      if (passwordMatch) {
        try {
          const returnedtoken = await insertGeneratedToken(stored_user_id);
          return res.json({message: "Token generated for " + username, token: returnedtoken, expires_in: "30 days"});
        } catch (SQLError) { console.log(SQLError);
          return res.status(409).json({ error: "SQL error inserting token" });
        }
      } else {
        return res.status(409).json({ error: "Wrong username/password." });
      }
    } catch (ComparingError) { console.log(ComparingError);
      return res.status(409).json({ error: "Password comparing error" });
    }
});

app.post("/add-variable", async (req, res) => {
  const username        =   req.body.username;
  const password        =   req.body.password;
  const variable_name   =   req.body.variable_name;
  const value           =   req.body.value;
  let variable_type     =   req.body.variable_type;
  let unit              =   req.body.unit;

  if (DetectUndefined(username,password,variable_name,value)) {
    let nullVars = [];
    if (username      === undefined) {nullVars.push("username");}
    if (password      === undefined) {nullVars.push("password");}
    if (variable_name === undefined) {nullVars.push("variable_name");}
    if (value         === undefined) {nullVars.push("value");}

    return res.status(409).json({ error: "All fields must be specified: " + nullVars.join(',') });
  }

  if (variable_type) {
    if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
      if (!CheckVariableIf(variable_type, value)) {
        return res.status(409).json({ error: "Expected " + variable_type });
      } 
    } else {
      return res.status(409).json({ error: "Expected types are only numeric, text, or boolean" });
    }
  } else {variable_type="text";}
  if (unit === undefined) {unit="";}

  // Check if username is in the database
  const stored_user = await selectUserByUsername(username);
  if ((stored_user.length < 1)) {
    return res.status(409).json({ error: "Wrong username/password" });
  }

  // Check if Password is matched with the stored
  const stored_user_id = stored_user[0]['id'];
  const stored_user_pw = stored_user[0]['pw'];
  const passwordMatch = await comparePassword(password, stored_user_pw);
  if (passwordMatch) {
    // Check if user already has the variable name
    const variable_name_found = await findVariableName(variable_name,stored_user_id);
    if (variable_name_found.length > 0) {
      return res.status(409).json({ error: "You already have used that variable name, try another." });
    }
    // Insert the variable name
    try {
      await insertVariableName(stored_user_id, variable_name, value, variable_type, unit); 
      return res.json({ message: "Variable is added", variable: variable_name, value: value });
    } catch (SQLError) { console.log(SQLError);
      return res.status(409).json({ error: "SQL Error inserting variable name." });
    }
  } else {
    return res.status(409).json({ error: "Wrong username/password." });
  }
});

app.post("/add-variable-viatoken", async (req, res) => {
  const token           =   req.body.token;
  const variable_name   =   req.body.variable_name;
  const value           =   req.body.value;
  let variable_type     =   req.body.variable_type;
  let unit              =   req.body.unit;

  if (DetectUndefined(token,variable_name,value)) {
    let nullVars = [];
    if (token === undefined) {nullVars.push("token");}
    if (variable_name === undefined) {nullVars.push("variable_name");}
    if (value         === undefined) {nullVars.push("value");}

    return res.status(409).json({ error: "All fields must be specified: " + nullVars.join(',') });
  }

  if (variable_type) {
    if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
      if (!CheckVariableIf(variable_type, value)) {
        return res.status(409).json({ error: "Expected " + variable_type });
      } 
    } else {
      return res.status(409).json({ error: "Expected types are only numeric, text, or boolean" });
    }
  } else {variable_type="text";}
  if (unit === undefined) {unit="";}

  // Check if token is in the database
  const stored_token = await selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }

  // Check if user already has the variable name
  const stored_token_id = stored_token[0]['user_id'];
  const variable_name_found = await findVariableName(variable_name,stored_token_id);
  if (variable_name_found.length > 0) {
    return res.status(409).json({ error: "You already have used that variable name, try another." });
  }

  // Insert the variable name
  try {
    await insertVariableName(stored_token_id, variable_name, value, variable_type, unit); 
    return res.json({ message: "Variable is added", variable: variable_name, value: value });
  } catch (SQLError) { console.log(SQLError);
    return res.status(409).json({ error: "SQL Error inserting variable name." });
  }
});

app.post("/update-variable-viatoken", async (req, res) => {
  const token           =   req.body.token;
  const variable_name   =   req.body.variable_name;
  const value           =   req.body.value;

  if (DetectUndefined(token,variable_name,value)) {
    let nullVars = [];
    if (token === undefined) {nullVars.push("token");}
    if (variable_name === undefined) {nullVars.push("variable_name");}
    if (value         === undefined) {nullVars.push("value");}

    return res.status(409).json({ error: "All fields must be specified: " + nullVars.join(',') });
  }

  // Check if token is in the database
  const stored_token = await selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }

  // Check if user has the variable name
  const stored_token_id = stored_token[0]['user_id'];
  const variable_name_found = await findVariableName(variable_name,stored_token_id);
  if (variable_name_found.length < 1) {
    return res.status(409).json({ error: "Variable name not found" });
  }

  // Check if value input matches the variable type
  const variable_type = variable_name_found[0]["variable_type"];
  if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
    if (!CheckVariableIf(variable_type, value)) {
      return res.status(409).json({ error: "Expected " + variable_type });
    } 
  }

  // SQL Update the variable
  const variable_id = variable_name_found[0]["id"];
  await updateVariable(variable_id,value);
  return res.json({ message: "Variable is updated", variable: variable_name, value: value });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});