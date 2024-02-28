const usersRoutes = require("express").Router();

const controller = require("../../controllers/users");

usersRoutes.post("/", controller.validations.signUp, controller.signUp);

module.exports = usersRoutes;
