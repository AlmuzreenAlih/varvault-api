import express from "express";
import * as varControllers from "../controllers/varControllers.js"

const varRouter = express.Router();
varRouter.post("/add",              varControllers.addVariable);
varRouter.post("/add-viatoken",     varControllers.addVariableViaToken);
varRouter.post("/update-viatoken",  varControllers.updateVariableViaToken);
varRouter.post("/delete",           varControllers.deleteVariable);
varRouter.post("/read",             varControllers.readVariable);
varRouter.post("/read-all/:format", varControllers.readVariableViaToken);

export default varRouter;