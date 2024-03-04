const usersRoutes = require("express").Router();

const controller = require("../../controllers/users");

usersRoutes.post("/", controller.validations.signUp, controller.signUp);
usersRoutes.put("/", controller.validations.update, controller.update);

module.exports = usersRoutes;
