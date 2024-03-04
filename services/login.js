/**
 * @typedef SignTokenOptions
 * @property {number} [idUser] ID do usuário que foi autenticado.
 * @property {string} [email] E-mail do usuário que foi autenticado.
 * @property {string} [password] Senha do usuário que foi autenticado.
 */

const { verify, sign } = require("jsonwebtoken");

const models = require("../database/models");

const KEY_TOKEN = ".A!i^~V}w*6j&&PIcJm&S*}p>(9e'6wq";
const EXPIRATION_TIME = 3 * 24 * 60 * 60;

class LoginService {
	/**
	 * Middleware para verificar se o usuário está autenticado e autorizado a acessar o sistema.
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 * @param {import("express").NextFunction} next
	 */
	ensureAuthorized (req, res, next) {
		const token = req.headers.authentication;
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
	 * Gera o token assinado para o usuário.
	 * @param {SignTokenOptions} searchParams parâmetros para buscar usuário.
	 * @returns
	 */
	async signToken ({ idUser, email, password }) {
		const user = await models.User.findOne({
			attributes: ["idUser", "name", "email", "micOnByDefault", "interfaceLanguage"],
			where: idUser ? { idUser } : { email, password }
		});

		if (!user)
			return null;

		return sign(user.toJSON(), KEY_TOKEN, { expiresIn: EXPIRATION_TIME });
	}
}

const loginService = new LoginService();
module.exports = loginService;
