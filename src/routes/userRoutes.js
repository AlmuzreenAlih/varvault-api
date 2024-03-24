import express from "express";
import * as userControllers from "../controllers/userControllers.js"

const userRouter = express.Router();
userRouter.post("/register",  userControllers.register);  //Previously app.
userRouter.post("/gen-token", userControllers.genToken);
userRouter.patch("/change-username", userControllers.changeUsername);
userRouter.patch("/change-password", userControllers.changePassword);
userRouter.post("/get-all-tokens", userControllers.getAllTokens);
userRouter.patch("/renew-token", userControllers.renewToken);

export default userRouter;