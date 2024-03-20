import express from "express";

const publicRouter = express.Router();
publicRouter.get("/:tab", async (req, res) => {
     if (req.params.tab == "basics")            {res.render("index.ejs", { activeTab: "basi" });}

else if (req.params.tab == "register")          {res.render("index.ejs", { activeTab: "regi" });}
else if (req.params.tab == "generate-token")    {res.render("index.ejs", { activeTab: "gene" });}
else if (req.params.tab == "add-variable")      {res.render("index.ejs", { activeTab: "addv" });}
else if (req.params.tab == "update-variable")   {res.render("index.ejs", { activeTab: "upda" });}
else if (req.params.tab == "delete-variable")   {res.render("index.ejs", { activeTab: "dele" });}
else if (req.params.tab == "read-variable")     {res.render("index.ejs", { activeTab: "read" });}
else if (req.params.tab == "read-variable-all") {res.render("index.ejs", { activeTab: "reaD" });}

else if (req.params.tab == "tuts-nodemcu")      {res.render("index.ejs", { activeTab: "node" });}
else if (req.params.tab == "tuts-rasperry-pi")  {res.render("index.ejs", { activeTab: "rasp" });}

else {res.render("notfound.ejs");}
});

publicRouter.get("/", async (req, res) => {
 res.render("index.ejs", { activeTab: "ovrv" });
});

export default publicRouter;