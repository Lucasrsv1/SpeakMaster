const { body } = require("express-validator");
const { sha512 } = require("js-sha512");

const models = require("../database/models");
const { isRequestInvalid } = require("../utils/http-validation");

const loginController = require("./login");

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
}

const usersController = new Users();
module.exports = usersController;
