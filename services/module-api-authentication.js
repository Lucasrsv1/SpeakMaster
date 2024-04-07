const { verify, sign, decode } = require("jsonwebtoken");

const models = require("../database/models");

const KEY_TOKEN = "21DC$5~bGR#SEv*{+<9as44]T7MMp8Fn";
const EXPIRATION_TIME = 3 * 24 * 60 * 60;

class ModuleAPIAuthenticationService {
	/**
	 * Middleware para verificar se o módulo está autenticado e autorizado a acessar o sistema.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 * @param {import("express").NextFunction} next
	 */
	ensureAuthorizedModule (req, res, next) {
		const token = req.headers.authentication;
		if (!token) {
			res.status(403).json({ message: "Access denied.", expired: true });
			return res.end();
		}

		verify(token, KEY_TOKEN, (error, module) => {
			if (error) {
				res.status(403).json({
					message: "Access denied.",
					expired: error.name === "TokenExpiredError",
					error
				});
				return res.end();
			}

			res.locals.module = module;
			next(null);
		});
	}

	/**
	 * Gera o token assinado para o módulo.
	 * @param {string} apiKey UUID(v4) que identifica o módulo.
	 * @param {string} apiSecret Hash da senha do módulo.
	 * @returns
	 */
	async signToken (apiKey, apiSecret) {
		const module = await models.Module.findOne({
			attributes: ["idModule", "name"],
			where: { apiKey, apiSecret }
		});

		if (!module)
			return { };

		const token = sign(module.toJSON(), KEY_TOKEN, { expiresIn: EXPIRATION_TIME });
		const decoded = decode(token);

		return {
			token,
			expirationTime: decoded.exp
		};
	}
}

const moduleAPIAuthenticationService = new ModuleAPIAuthenticationService();
module.exports = moduleAPIAuthenticationService;
