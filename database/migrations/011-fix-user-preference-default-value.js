"use strict";

/**
 * @type {import("sequelize-cli").Migration}
 */
module.exports = {
	/**
	 * Função de aplicação da migração
	 */
	up: async (queryInterface, Sequelize) => {
		await queryInterface.changeColumn("user_module", "preferences", {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: {}
		});
	},

	/**
	 * Função que desfaz a migração
	 */
	down: async (queryInterface, Sequelize) => {
		await queryInterface.changeColumn("user_module", "preferences", {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: []
		});
	}
};
