import express from "express";
import * as userControllers from "../controllers/userControllers.js"

const userRouter = express.Router();
userRouter.post("/register",  userControllers.register);  //Previously app.
userRouter.post("/gen-token", userControllers.genToken);

export default userRouter;