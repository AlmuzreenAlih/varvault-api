import express from "express";
import bodyParser from "body-parser";
import TokenGenerator from 'token-generator';
import bcrypt from "bcrypt";
const saltRounds = 10;

const tokenGenerator = new TokenGenerator({
  salt: 'your secret ingredient for this magic recipe.',
  timestampMap: 'abcdefghij', // 10 chars array for obfuscation purposes
});

import vine from '@vinejs/vine'

const userpwSchema = vine.object({
  username: vine
    .string()
    .minLength(8)
    .maxLength(32),
  password: vine
    .string()
    .minLength(8)
    .maxLength(32)
})


import pg from "pg";
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PW,
  port: process.env.PG_PORT,
});
db.connect();

import 'dotenv/config'
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

    let result = await db.query(
      "SELECT * FROM users WHERE us = $1",
      [username]
    ); if (result.rows.length > 0) {
      res.status(409);
      res.json({error: "Username already registered"});
    }

    let data = {username: username, password: password}
    const validator = vine.compile(userpwSchema);
    try {await validator.validate(data);}
    catch(error) {
      res.status(error["status"]);
      res.json({error: error});
    }
    
    bcrypt.hash(password, saltRounds, async (err,hash) => {
      if (err) {
        res.json({error: "Error occured in hashing."});
      } else {
        await db.query(
          "INSERT INTO users (us, pw) VALUES ($1, $2)",
          [username, hash]
        );
        res.json({message: "Registration Successful for " + username + "."});
      }
    });
});

app.post("/gen-token", async (req, res) => {
    const username        =   req.body.username;
    const password_input  =   req.body.password;

    let result = await db.query(
      "SELECT * FROM users WHERE us = $1",
      [username]
    ); if (result.rows.length < 1) {
      res.status(409);
      res.json({error: "Username and password combination error.."});
      return;
    }

    let stored_user_id = result.rows[0]['id'];
    let stored_user_pw = result.rows[0]['pw'];
    bcrypt.compare(password_input, stored_user_pw, async (err, result) => {
      if (err) {
        res.json({error: "Error occured in hash comparing."});
      } else {
        if (result) {
          var token = tokenGenerator.generate();
          await db.query(
            "INSERT INTO tokens (user_id, token) VALUES ($1, $2)",
            [stored_user_id, token]
          );
          res.json({message: "Token generated for " + username, token: token, expires_in: "30 days"});
        } else {
          res.status(409);
          res.json({error: "Username and password combination error."});
        }
      }
    });
});

app.post("/add-variable", async (req, res) => {
  const username        =   req.body.username;
  const password_input  =   req.body.password;
  const variable_name   =   req.body.variable_name;
  const value           =   req.body.value;

  let result = await db.query(
    "SELECT * FROM users WHERE us = $1",
    [username]
  ); if (result.rows.length < 1) {
    res.status(409);
    res.json({error: "Username and password combination error.."});
    return;
  }

  result = await db.query(
    "SELECT * FROM variables WHERE variable_name = $1",
    [variable_name]
  ); if (result.rows.length > 0) {
    res.status(409);
    res.json({error: "You already have used that variable name, try another."});
    return;
  }

  let stored_user_id = result.rows[0]['id'];
  let stored_user_pw = result.rows[0]['pw'];
  bcrypt.compare(password_input, stored_user_pw, async (err, result) => {
    if (err) {
      res.json({error: "Error occured in hash comparing."});
    } else {
      if (result) {
        try {
          await db.query(
            "INSERT INTO variables (user_id, variable_name, value, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)",
            [stored_user_id, variable_name, value]
          );
      
          res.json({message: "Variable is added", variable: variable_name, value: value});
        } catch {
          res.json({error: "Error occured at SQL: INSERT."});
        }
      } else {
        res.status(409);
        res.json({error: "Username and password combination error."});
      }
    }
  });  
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});