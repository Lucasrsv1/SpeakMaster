const { body } = require("express-validator");

const models = require("../database/models");
const { isRequestInvalid } = require("../utils/http-validation");

const loginService = require("../services/login");

class LanguageCommands {
	constructor () {
		/**
		 * Middlewares das validações das rotas.
		 */
		this.validations = {
			get: loginService.ensureAuthorized,
			update: [
				loginService.ensureAuthorized,
				body("languagesToListen").isArray().withMessage("Languages to listen must be an array."),
				body("languagesToListen.*").isString().withMessage("Invalid language to listen.")
			]
		};
	}

	/**
	 * Rota de obtenção dos comandos de troca de idioma do usuário.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async get (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			const { languageCommands } = await models.User.findOne({
				attributes: ["languageCommands"],
				where: {
					idUser: res.locals.user.idUser
				}
			});

			res.status(200).json(languageCommands);
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error getting language commands.", error });
		}
	}

	/**
	 * Rota de atualização dos comandos de troca de idioma de um usuário.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async update (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			const [ affectedCount ] = await models.User.update({ languageCommands: req.body }, {
				where: {
					idUser: res.locals.user.idUser
				}
			});

			if (affectedCount > 0)
				res.status(200).json({ message: "Language commands updated." });
			else
				res.status(404).json({ message: "Language commands not updated. Couldn't find user." });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error updating language commands.", error });
		}
	}
}

const languageCommandsController = new LanguageCommands();
module.exports = languageCommandsController;
