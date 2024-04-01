import express from "express";
import * as privateControllers from "../controllers/privateControllers.js";

const privateRouter = express.Router();
privateRouter.post("/login",  privateControllers.login);  //Previously app.
privateRouter.post("/register",  privateControllers.register);  //Previously app.
privateRouter.post("/username-check",  privateControllers.usernameChecker);  //Previously app.
privateRouter.post("/auth",  privateControllers.auth);  //Previously app.
privateRouter.post("/get-all",  privateControllers.getAll);  //Previously app.

export default privateRouter;