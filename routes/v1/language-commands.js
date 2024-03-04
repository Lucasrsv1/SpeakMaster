const languageCommandsRoutes = require("express").Router();

const controller = require("../../controllers/language-commands");

languageCommandsRoutes.get("/", controller.validations.get, controller.get);
languageCommandsRoutes.patch("/", controller.validations.update, controller.update);

module.exports = languageCommandsRoutes;
