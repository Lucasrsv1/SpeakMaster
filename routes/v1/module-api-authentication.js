const moduleAPIAuthenticationRoutes = require("express").Router();

const controller = require("../../controllers/module-api-authentication");

moduleAPIAuthenticationRoutes.get("/validation", controller.validations.validate, controller.validate);

moduleAPIAuthenticationRoutes.post("/", controller.validations.moduleAPIAuthentication, controller.moduleAPIAuthentication);

module.exports = moduleAPIAuthenticationRoutes;
