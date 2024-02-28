const loginRoutes = require("express").Router();

const controller = require("../../controllers/login");

loginRoutes.post("/", controller.validations.login, controller.login);

module.exports = loginRoutes;
