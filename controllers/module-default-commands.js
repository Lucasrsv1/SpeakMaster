const { param } = require("express-validator");

const models = require("../database/models");
const { isRequestInvalid } = require("../utils/http-validation");

const loginService = require("../services/login");

class ModuleDefaultCommands {
	constructor () {
		/**
		 * Middlewares das validações das rotas.
		 */
		this.validations = {
			get: [
				loginService.ensureAuthorized,
				param("idModule").isInt({ gt: 0 }).withMessage("Invalid module.").toInt()
			]
		};
	}

	/**
	 * Rota de obtenção dos comandos padrões de um certo módulo.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async get (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			const moduleDefaultCommands = await models.ModuleDefaultCommands.findAll({
				attributes: ["idModuleDefaultCommands", "idModule", "language", "commands"],
				where: {
					idModule: req.params.idModule
				}
			});

			res.status(200).json(moduleDefaultCommands);
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error finding module's default commands.", error });
		}
	}
}

const moduleDefaultCommandsController = new ModuleDefaultCommands();
module.exports = moduleDefaultCommandsController;
