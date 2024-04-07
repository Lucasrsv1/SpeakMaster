const v1 = require("express").Router();

const generalRoutes = require("./general");
const languageCommandsRoutes = require("./language-commands");
const loginRoutes = require("./login");
const moduleAPIAuthenticationRoutes = require("./module-api-authentication");
const userModulesRoutes = require("./user-modules");
const usersRoutes = require("./users");

v1.use("/", generalRoutes);
v1.use("/login", loginRoutes);
v1.use("/modules/api/authentication", moduleAPIAuthenticationRoutes);
v1.use("/users", usersRoutes);
v1.use("/users/language-commands", languageCommandsRoutes);
v1.use("/users/modules", userModulesRoutes);

module.exports = v1;
