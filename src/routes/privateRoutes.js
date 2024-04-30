import express from "express";
import * as privateControllers from "../controllers/privateControllers.js";

const privateRouter = express.Router();
privateRouter.post("/login",  privateControllers.login); 
privateRouter.post("/register",  privateControllers.register); 
privateRouter.post("/username-check",  privateControllers.usernameChecker); 
privateRouter.post("/auth",  privateControllers.auth); 
privateRouter.post("/get-all",  privateControllers.getAll); 
privateRouter.post("/get-logs",  privateControllers.getLogs); 
privateRouter.post("/get-variables",  privateControllers.getVariables); 
privateRouter.post("/get-tokens",  privateControllers.getTokens); 
privateRouter.post("/edit-variable",  privateControllers.editVariable); 
privateRouter.post("/delete-variable",  privateControllers.deleteVariable); 
privateRouter.post("/add-variable",  privateControllers.addVariable); 
privateRouter.post("/delete-multiple-variables",  privateControllers.deleteVariablesMoreThan1); 

privateRouter.post("/renew-token",  privateControllers.renewToken); 
privateRouter.post("/delete-token",  privateControllers.deleteToken); 
privateRouter.post("/new-token",  privateControllers.addToken); 
privateRouter.post("/delete-multiple-tokens",  privateControllers.deleteTokensMoreThan1); 

privateRouter.post("/change-username",  privateControllers.changeUsername); 
privateRouter.post("/change-password",  privateControllers.changePassword); 

export default privateRouter;