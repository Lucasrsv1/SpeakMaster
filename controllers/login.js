const { body } = require("express-validator");
const { sha512 } = require("js-sha512");
const { sign, verify } = require("jsonwebtoken");

const models = require("../database/models");
const { isRequestInvalid } = require("../utils/http-validation");

const KEY_TOKEN = ".A!i^~V}w*6j&&PIcJm&S*}p>(9e'6wq";
const EXPIRATION_TIME = 3 * 24 * 60 * 60;

class Login {
	constructor () {
		/**
		 * Middlewares das validações das rotas de autenticação.
		 */
		this.validations = {
			login: [
				body("email").isEmail().withMessage("Invalid email.").normalizeEmail(),
				body("password").isString().withMessage("Invalid password.")
			]
		};
	}

	/**
	 * Middleware para verificar se o usuário está autenticado e autorizado a acessar o sistema.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 * @param {import("express").NextFunction} next
	 */
	ensureAuthorized (req, res, next) {
		const token = req.headers.Authentication;
		if (!token) {
			res.status(403).json({ message: "Access denied.", expired: true });
			return res.end();
		}

		verify(token, KEY_TOKEN, (error, user) => {
			if (error) {
				res.status(403).json({
					message: "Access denied.",
					expired: error.name === "TokenExpiredError",
					error
				});
				return res.end();
			}

			res.locals.user = user;
			next(null);
		});
	}

	/**
	 * Rota de autenticação do usuário.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async login (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			// Faz o hash da senha antes de fazer o login
			const password = sha512(req.body.password);

			const user = await models.User.findOne({
				attributes: ["idUser", "name", "email", "micOnByDefault", "interfaceLanguage", "languageCommands"],
				where: {
					email: req.body.email,
					password
				}
			});

			if (!user)
				return res.status(403).json({ message: "Wrong email or password." });

			const token = sign(user.toJSON(), KEY_TOKEN, { expiresIn: EXPIRATION_TIME });
			res.status(200).json({ token });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error logging in.", error });
		}
	}
}

const loginController = new Login();
module.exports = loginController;
