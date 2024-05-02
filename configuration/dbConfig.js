// import pg from "pg";
// const db = new pg.Client({
//   user: process.env.PG_USER,
//   host: process.env.PG_HOST,
//   database: process.env.PG_DB,
//   password: process.env.PG_PW,
//   port: process.env.PG_PORT,
//   // ssl: {
//   //   rejectUnauthorized: false // Depending on your PostgreSQL setup, you might need to set this to true or remove it
//   // }
// });
// db.connect();

// export default db;

import mysql from "mysql";

var connection = mysql.createConnection({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USER,
  password : process.env.MYSQL_PW,
  database : process.env.MYSQL_DB
});

connection.connect();
export default connection;