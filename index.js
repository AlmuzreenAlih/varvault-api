import 'dotenv/config'
import cors from 'cors';
import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./src/routes/userRoutes.js"
import varRoutes from "./src/routes/varRoutes.js"
import publicRoutes from "./src/routes/publicRoutes.js"
import privateRoutes from "./src/routes/privateRoutes.js"

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set('views', './src/views');

app.use("", publicRoutes);
app.use("/user", userRoutes);
app.use("/var", varRoutes);

app.use("/private", privateRoutes);

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}/`);
});