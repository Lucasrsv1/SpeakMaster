const { body } = require("express-validator");
const { sha512 } = require("js-sha512");

const moduleAPIAuthenticationService = require("../services/module-api-authentication");
const { isRequestInvalid } = require("../utils/http-validation");

class ModuleAPIAuthentication {
	constructor () {
		/**
		 * Middlewares das validações das rotas.
		 */
		this.validations = {
			validate: moduleAPIAuthenticationService.ensureAuthorizedModule,
			moduleAPIAuthentication: [
				body("apiKey").isUUID("4").withMessage("Invalid API Key."),
				body("apiSecret").isString().withMessage("Invalid API Secret.")
			]
		};
	}

	/**
	 * Rota de validação da autenticação de um módulo.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async validate (req, res) {
		res.status(204).end();
	}

	/**
	 * Rota de autenticação de módulos.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	async moduleAPIAuthentication (req, res) {
		if (isRequestInvalid(req, res)) return;

		try {
			// Faz o hash da senha antes de fazer o moduleAPIAuthentication
			const apiSecretHash = sha512(req.body.apiSecret);

			const { token, expirationTime } = await moduleAPIAuthenticationService.signToken(req.body.apiKey, apiSecretHash);
			if (!token)
				return res.status(403).json({ message: "Wrong API Key or API Secret." });

			res.status(200).json({ token, expirationTime });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error authenticating module.", error });
		}
	}
}

const moduleAPIAuthenticationController = new ModuleAPIAuthentication();
module.exports = moduleAPIAuthenticationController;
