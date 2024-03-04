"use strict";

/**
 * @type {import("sequelize-cli").Migration}
 */
module.exports = {
	/**
	 * Função de aplicação da migração
	 */
	up: async (queryInterface, Sequelize) => {
		await queryInterface.changeColumn("user", "language_commands", {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: "{ \"pt-BR\": [], \"languagesToListen\": [\"pt-BR\"] }"
		});
	},

	/**
	 * Função que desfaz a migração
	 */
	down: async (queryInterface, Sequelize) => {
		await queryInterface.changeColumn("user", "language_commands", {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: "[]"
		});
	}
};
