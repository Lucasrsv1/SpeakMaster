const v1 = require("express").Router();

const generalRoutes = require("./general");
const loginRoutes = require("./login");
const usersRoutes = require("./users");

v1.use("/", generalRoutes);
v1.use("/login", loginRoutes);
v1.use("/users", usersRoutes);

module.exports = v1;
