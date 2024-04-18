const models = require("../database/models");

class UserModuleCommandsService {
	/**
	 * Rota de atualização das configurações de um módulo do usuário para um certo idioma.
	 * @param {number} idUser Identificador do usuário autenticado.
	 * @param {number} idUserModule Identificador do módulo do usuário.
	 * @param {string} language Idioma sendo configurado.
	 * @param {Partial<{ commands: any[], prefix: string, isPrefixMandated: boolean }>} data Dados a serem atualizados.
	 */
	async upsert (idUser, idUserModule, language, data) {
		try {
			const userModule = await models.UserModule.findOne({
				attributes: ["idUserModule"],
				where: {
					idUserModule,

					// Ensure the user's module commands belong to the authenticated user.
					idUser
				}
			});

			if (!userModule)
				return null;

			const [ affectedCount ] = await models.UserModuleCommands.update(data, {
				where: {
					idUserModule,
					language
				}
			});

			let userModuleCommands;
			if (affectedCount > 0) {
				userModuleCommands = await models.UserModuleCommands.findOne({
					attributes: ["idUserModuleCommands", "idUserModule", "language", "commands", "prefix", "isPrefixMandated"],
					where: {
						idUserModule,
						language
					}
				});
			} else {
				userModuleCommands = await models.UserModuleCommands.create({
					idUserModule,
					language,
					...data
				}, { returning: true });
			}

			if (!userModuleCommands)
				throw "Error updating the user's module commands.";

			userModuleCommands = userModuleCommands.toJSON();
			delete userModuleCommands.createdAt;
			delete userModuleCommands.updatedAt;
			delete userModuleCommands.deletedAt;

			return userModuleCommands;
		} catch (error) {
			console.error(error);
			throw "Error updating the user's module commands.";
		}
	}
}

const userModuleCommandsService = new UserModuleCommandsService();
module.exports = userModuleCommandsService;
