import express from "express";
import bodyParser from "body-parser";

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
  user: "postgres",
  host: "localhost",
  database: "varvault_db",
  password: "handlepc12",
  port: 5432,
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
    let username = req.body.username;
    let password = req.body.password;
    console.log([username,password]);
    let result = await db.query(
      "SELECT * FROM users WHERE us = $1",
      [username]
    );

    let data = {username: username, password: password}
    const validator = vine.compile(userpwSchema);
    try {await validator.validate(data);}
    catch(error) {
      res.status(error["status"]);
      res.json({error: error});
      return;
    }
    if (result.rows.length > 0) {
      res.status(409);
      res.json({error: "Username already registered"});
      return;
    }
    
    await db.query(
      "INSERT INTO users (us, pw) VALUES ($1, $2)",
      [username, password]
    );
    res.json({message: "Registration Successful for " + username + "."});
});

app.post("/generate", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    res.json({message: "Token generated for " + username + "."});
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

let users = [
    {id: 1, username: "dendencyber", password: "haha123"},
    {id: 2, username: "dendencyber2", password: "haha1234"},
];

let tokens = [
    {id:1, token: "abcdefghijkl", timestamp: "04.04.04"}
]