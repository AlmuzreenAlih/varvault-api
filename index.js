import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";

import { selectUserByUsername, insertUser } from './dbOps.js';
import { validateUserData } from './validator.js';
import { hashPassword } from './hash.js';

function CheckVariableIf(type, value) {
  switch (type) {
      case "numeric":
          return !isNaN(parseFloat(value)) && isFinite(value);
      case "text":
          return typeof value === "string";
      case "boolean":
          return value === "true" || value === "false";
      default:
          return false; // Unsupported type
  }
}


import TokenGenerator from 'token-generator';

const tokenGenerator = new TokenGenerator({
  salt: 'your secret ingredient for this magic recipe.',
  timestampMap: 'abcdefghij', // 10 chars array for obfuscation purposes
});

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
    } catch(error) {
      return res.status(error["status"]).json({ error: error });
    }
    
    //Hash the password
    try {
      const hashedPassword = await hashPassword(password);
      try {
        await insertUser(username, hashedPassword);
        res.json({message: "Registration Successful for " + username + "."});
      } catch {
        return res.status(400).json({ error: "Error at SQL Registration" });
      }
    } catch {
      return res.status(400).json({ error: "Error at password hashing" });
    }
});

// app.post("/gen-token", async (req, res) => {
//     const username        =   req.body.username;
//     const password_input  =   req.body.password;

//     let result = await db.query(
//       "SELECT * FROM users WHERE us = $1",
//       [username]
//     ); if (result.rows.length < 1) {
//       res.status(409);
//       res.json({error: "Username and password combination error.."});
//       return;
//     }

//     let stored_user_id = result.rows[0]['id'];
//     let stored_user_pw = result.rows[0]['pw'];
//     bcrypt.compare(password_input, stored_user_pw, async (err, result) => {
//       if (err) {
//         res.json({error: "Error occured in hash comparing."});
//       } else {
//         if (result) {
//           var token = tokenGenerator.generate();
//           await db.query(
//             "INSERT INTO tokens (user_id, token) VALUES ($1, $2)",
//             [stored_user_id, token]
//           );
//           res.json({message: "Token generated for " + username, token: token, expires_in: "30 days"});
//         } else {
//           res.status(409);
//           res.json({error: "Username and password combination error."});
//         }
//       }
//     });
// });

// function DetectUndefined() {
//   for (let i = 0; i < arguments.length; i++) {if (arguments[i] === undefined) {return true;}}
//   return false;
// }

// app.post("/add-variable", async (req, res) => {
//   const username        =   req.body.username;
//   const password        =   req.body.password;
//   const variable_name   =   req.body.variable_name;
//   const value           =   req.body.value;
//   let variable_type     =   req.body.variable_type;
//   let unit              =   req.body.unit;

//   if (DetectUndefined(username,password,variable_name,value)) {
//     res.status(409);
//     let nullVars = [];
//     if (username===undefined) {nullVars.push("username");}
//     if (password===undefined) {nullVars.push("password");}
//     if (variable_name===undefined) {nullVars.push("variable_name");}
//     if (value===undefined) {nullVars.push("value");}

//     res.json({error: "All fields must be specified: " + nullVars.join(',')});
//     return;
//   }

//   if (variable_type) {
//     if (variable_type == "numeric" || variable_type == "text" || variable_type == "boolean") {
//       if (!CheckVariableIf(variable_type, value)) {
//         res.status(409);
//         res.json({error: "Expected " + variable_type});
//         return;
//       } 
//     } else {
//       res.status(409);
//       res.json({error: "Expected types are only numeric, text, or boolean"});
//       return;
//     }
//   } else {variable_type="text";}
//   if (unit===undefined) {unit="";}

//   let userQuery = await db.query(
//     "SELECT * FROM users WHERE us = $1",
//     [username]
//   ); if (userQuery.rows.length < 1) {
//     res.status(409);
//     res.json({error: "Username/password error.."});
//     return;
//   }

//   let stored_user_id = userQuery.rows[0]['id'];
//   let stored_user_pw = userQuery.rows[0]['pw'];
//   bcrypt.compare(password, stored_user_pw, async (err, result) => {
//     if (err) {
//       res.json({error: "Error occured in hash comparing."});
//     } else {
//       if (result) {
//         let variableNameQuery = await db.query(
//           "SELECT * FROM variables WHERE variable_name = $1",
//           [variable_name]
//         ); if (variableNameQuery.rows.length > 0) {
//           res.status(409);
//           res.json({error: "You already have used that variable name, try another."});
//           return;
//         }
        
//         try {
//           await db.query(
//             "INSERT INTO variables (user_id, variable_name, value, variable_type,unit,updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)",
//             [stored_user_id, variable_name, value, variable_type, unit]
//           );
      
//           res.json({message: "Variable is added", variable: variable_name, value: value});
//         } catch {
//           res.json({error: "Error occured at SQL: INSERT."});
//         }
//       } else {
//         res.status(409);
//         res.json({error: "Username/password error."});
//       }
//     }
//   });  
// });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});