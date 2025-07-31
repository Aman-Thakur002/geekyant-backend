const express = require("express");
const api = express.Router();
const auth = require("../middleware/auth");
const roleController = require("../controller/roles.controller");


api.post("/",auth.ensureAuth("Manager","Engineer"), roleController.createRole);
api.get("/", auth.ensureAuth("Engineer", "Manager"), roleController.getRoles);
api.get("/:id",auth.ensureAuth("Manager","Engineer"), roleController.getRoleById);
api.put("/:id",auth.ensureAuth("Manager","Engineer"), roleController.updateRole);
api.delete(
  "/delete",
 auth.ensureAuth("Manager","Engineer"),
  roleController.bulkDelete
);
api.delete("/:id",auth.ensureAuth("Manager","Engineer"), roleController.deleteRole);

module.exports = api;
