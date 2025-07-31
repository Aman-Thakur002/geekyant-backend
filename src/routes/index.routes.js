const express = require("express");
const api = express.Router();

api.use("/users", require("./users.routes"));
api.use("/roles", require("./roles.routes"));
api.use("/engineers", require("./engineer.routes"));
api.use("/projects", require("./project.routes"));
api.use("/assignments", require("./assignment.routes"));
api.use("/dashboard", require("./dashboard.routes"));
api.use("/analytics", require("./analytics.routes"));
module.exports = api;
