import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs", { content: "API Response." });
  });

//1. GET a random joke
app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log(username + " " + password);
    users.push({username: username, password: password});
    res.json(users);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

let users = [
    {username: "dendencyber", password: "haha123"},
    {username: "dendencyber2", password: "haha1234"},
];