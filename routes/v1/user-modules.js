const userModulesRoutes = require("express").Router();

const controller = require("../../controllers/user-modules");

userModulesRoutes.get("/", controller.validations.get, controller.get);
userModulesRoutes.patch("/active", controller.validations.toggleActive, controller.toggleActive);
userModulesRoutes.patch("/prefix", controller.validations.updatePrefix, controller.updatePrefix);

module.exports = userModulesRoutes;
