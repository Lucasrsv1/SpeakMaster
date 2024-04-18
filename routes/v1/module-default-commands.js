const moduleDefaultCommandsRoutes = require("express").Router();

const controller = require("../../controllers/module-default-commands");

moduleDefaultCommandsRoutes.get("/:idModule", controller.validations.get, controller.get);

module.exports = moduleDefaultCommandsRoutes;
