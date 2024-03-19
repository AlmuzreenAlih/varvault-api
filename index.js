import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./src/routes/userRoutes.js"
import varRoutes from "./src/routes/varRoutes.js"
import publicRoutes from "./src/routes/publicRoutes.js"

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', './src/views');

app.use("", publicRoutes);
app.use("/user", userRoutes);
app.use("/var", varRoutes);

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}/`);
});