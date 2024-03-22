import express from "express";
import * as varControllers from "../controllers/varControllers.js"

const varRouter = express.Router();
varRouter.post("/add",              varControllers.addVariable);
varRouter.post("/add-viatoken",     varControllers.addVariableViaToken);
varRouter.put("/update-viatoken",   varControllers.updateVariableViaToken);
varRouter.delete("/delete",         varControllers.deleteVariable);
varRouter.delete("/delete-viatoken",varControllers.deleteVariableViaToken);
varRouter.post("/read",             varControllers.readVariable);
varRouter.post("/read-all/:format", varControllers.readVariableViaToken);

export default varRouter;