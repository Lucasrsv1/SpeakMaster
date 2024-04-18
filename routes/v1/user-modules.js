const userModulesRoutes = require("express").Router();

const controller = require("../../controllers/user-modules");

userModulesRoutes.get("/", controller.validations.get, controller.get);
userModulesRoutes.patch("/active", controller.validations.toggleActive, controller.toggleActive);
userModulesRoutes.patch("/prefix", controller.validations.updatePrefix, controller.updatePrefix);
userModulesRoutes.patch("/commands", controller.validations.updateCommands, controller.updateCommands);

module.exports = userModulesRoutes;
