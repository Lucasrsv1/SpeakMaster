"use strict";

/**
 * @type {import("sequelize-cli").Migration}
 */
module.exports = {
	/**
	 * Função de aplicação da migração
	 */
	up: async (queryInterface, Sequelize) => {
		await queryInterface.addColumn("module", "features_definition", {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: "[]"
		});
	},

	/**
	 * Função que desfaz a migração
	 */
	down: async (queryInterface, Sequelize) => {
		await queryInterface.removeColumn("module", "features_definition");
	}
};
