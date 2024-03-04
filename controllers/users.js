const { body } = require("express-validator");
const { sha512 } = require("js-sha512");

const loginController = require("./login");

const loginService = require("../services/login");
const models = require("../database/models");
const { isRequestInvalid } = require("../utils/http-validation");

class Users {
	constructor () {
		/**
		 * Middlewares das validações das rotas de autenticação.
		 */
		this.validations = {
			signUp: [
				body("name").isString().withMessage("Invalid name."),
				body("email").isEmail().withMessage("Invalid email.").normalizeEmail(),
				body("password").isString().withMessage("Invalid password.")
			],
			update: [
				loginService.ensureAuthorized,
				body("name").isString().withMessage("Invalid name."),
				body("email").isEmail().withMessage("Invalid email.").normalizeEmail(),
				body("password").optional({ nullable: true }).isString().withMessage("Invalid password."),
				body("micOnByDefault").isBoolean().withMessage("Invalid value for microphone."),
				body("interfaceLanguage").isString().withMessage("Invalid interface language."),
				body("languageCommands").isObject().withMessage("Language commands must be an object."),
				body("languageCommands.languagesToListen").isArray().withMessage("Languages to listen must be an array."),
				body("languageCommands.languagesToListen.*").isString().withMessage("Invalid language to listen.")
			]
		};
	}

	/**
	 * Rota de cadastro de usuários.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async signUp (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			// Faz o hash da senha antes de fazer o cadastro
			const password = sha512(req.body.password);

			const existentUser = await models.User.findOne({ where: { email: req.body.email } });
			if (existentUser)
				res.status(400).json({ message: "User already exists." });

			await models.User.create({
				name: req.body.name,
				email: req.body.email,
				password
			});

			// Faz login usando o usuário cadastrado
			loginController.login(req, res);
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error signing up.", error });
		}
	}

	/**
	 * Rota de atualização do perfil de um usuário.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async update (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			const userData = {
				name: req.body.name,
				email: req.body.email,
				micOnByDefault: req.body.micOnByDefault,
				interfaceLanguage: req.body.interfaceLanguage,
				languageCommands: req.body.languageCommands
			};

			// Faz o hash da senha antes de atualizar o usuário
			if (req.body.password)
				userData.password = sha512(req.body.password);

			await models.User.update(userData, {
				where: {
					idUser: res.locals.user.idUser
				}
			});

			// Atualiza o login do usuário usando os campos atualizados
			const token = await loginService.signToken({ idUser: res.locals.user.idUser });
			if (!token)
				return res.status(403).json({ message: "Couldn't find user." });

			res.status(200).json({ token });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error updating user.", error });
		}
	}
}

const usersController = new Users();
module.exports = usersController;
