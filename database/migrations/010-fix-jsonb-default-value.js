"use strict";

/**
 * @type {import("sequelize-cli").Migration}
 */
module.exports = {
	/**
	 * Função de aplicação da migração
	 */
	up: async (queryInterface, Sequelize) => {
		const transaction = await queryInterface.sequelize.transaction();

		try {
			await queryInterface.changeColumn("module", "features_definition", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: []
			}, { transaction });

			await queryInterface.changeColumn("user", "language_commands", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: { "pt-BR": [], languagesToListen: ["pt-BR"] }
			}, { transaction });

			await queryInterface.changeColumn("user_module_commands", "commands", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: []
			}, { transaction });

			await queryInterface.changeColumn("user_module", "preferences", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: []
			}, { transaction });

			await queryInterface.changeColumn("module_default_commands", "commands", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: []
			}, { transaction });

			await queryInterface.changeColumn("module", "preferences_definition", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: []
			}, { transaction });

			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	},

	/**
	 * Função que desfaz a migração
	 */
	down: async (queryInterface, Sequelize) => {
		const transaction = await queryInterface.sequelize.transaction();

		try {
			await queryInterface.changeColumn("module", "features_definition", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: "[]"
			}, { transaction });

			await queryInterface.changeColumn("user", "language_commands", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: "{ \"pt-BR\": [], \"languagesToListen\": [\"pt-BR\"] }"
			}, { transaction });

			await queryInterface.changeColumn("user_module_commands", "commands", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: "[]"
			}, { transaction });

			await queryInterface.changeColumn("user_module", "preferences", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: "[]"
			}, { transaction });

			await queryInterface.changeColumn("module_default_commands", "commands", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: "[]"
			}, { transaction });

			await queryInterface.changeColumn("module", "preferences_definition", {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: "[]"
			}, { transaction });

			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}
};
