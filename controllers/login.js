const { body } = require("express-validator");
const { sha512 } = require("js-sha512");

const loginService = require("../services/login");
const { isRequestInvalid } = require("../utils/http-validation");

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
	 * Rota de autenticação do usuário.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async login (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			// Faz o hash da senha antes de fazer o login
			const password = sha512(req.body.password);

			const token = await loginService.signToken({
				email: req.body.email,
				password
			});

			if (!token)
				return res.status(403).json({ message: "Wrong email or password." });

			res.status(200).json({ token });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error logging in.", error });
		}
	}
}

const loginController = new Login();
module.exports = loginController;
