const { body } = require("express-validator");

const models = require("../database/models");
const { isRequestInvalid } = require("../utils/http-validation");

const loginService = require("../services/login");

class UserModules {
	constructor () {
		/**
		 * Middlewares das validações das rotas.
		 */
		this.validations = {
			get: loginService.ensureAuthorized,
			toggleActive: [
				loginService.ensureAuthorized,
				body("idUserModule").isInt({ gt: 0 }).withMessage("Invalid user module."),
				body("isActive").isBoolean({ strict: true }).withMessage("Invalid value for isActive.")
			],
			updatePrefix: [
				loginService.ensureAuthorized,
				body("idUserModule").isInt({ gt: 0 }).withMessage("Invalid user module."),
				body("prefix").isString().withMessage("Invalid prefix command."),
				body("isPrefixMandated").isBoolean({ strict: true }).withMessage("Invalid value for isPrefixMandated.")
			]
		};
	}

	/**
	 * Rota de obtenção dos módulos do usuário.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async get (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			const userModules = await models.UserModule.findAll({
				attributes: [
					"idUserModule", "idUser", "idModule", "isActive", "prefix", "isPrefixMandated",
					[models.sequelize.col("module.name"), "name"]
				],
				include: [{
					association: "module",
					attributes: []
				}, {
					association: "userModuleCommands",
					attributes: ["idUserModuleCommands", "idUserModule", "language", "commands"]
				}],
				where: {
					idUser: res.locals.user.idUser
				},
				order: [["name", "ASC"], ["idUserModule", "ASC"]]
			});

			res.status(200).json(userModules);
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error getting user's modules.", error });
		}
	}

	/**
	 * Rota de ativação e desativação de um módulo do usuário.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async toggleActive (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			const [ affectedCount ] = await models.UserModule.update({ isActive: req.body.isActive }, {
				where: {
					idUserModule: req.body.idUserModule,
					idUser: res.locals.user.idUser
				}
			});

			if (affectedCount > 0)
				res.status(200).json({ message: "User's module updated." });
			else
				res.status(404).json({ message: "User's module not found." });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error updating the user's module.", error });
		}
	}

	/**
	 * Rota de atualização do prefixo de um módulo do usuário.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async updatePrefix (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			const [ affectedCount ] = await models.UserModule.update({
				prefix: req.body.prefix,
				isPrefixMandated: req.body.isPrefixMandated
			}, {
				where: {
					idUserModule: req.body.idUserModule,
					idUser: res.locals.user.idUser
				}
			});

			if (affectedCount > 0)
				res.status(200).json({ message: "User's module updated." });
			else
				res.status(404).json({ message: "User's module not found." });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error updating the user's module.", error });
		}
	}
}

const userModulesController = new UserModules();
module.exports = userModulesController;
