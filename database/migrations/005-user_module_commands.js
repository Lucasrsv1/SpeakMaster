"use strict";

/**
 * @type {import("sequelize-cli").Migration}
 */
module.exports = {
	/**
	 * Função de aplicação da migração
	 */
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable("user_module_commands", {
			id_user_module_commands: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			id_user_module: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: { model: "user_module", key: "id_user_module" }
			},
			language: {
				type: Sequelize.STRING(20),
				allowNull: false
			},
			commands: {
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: "[]"
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn("NOW")
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn("NOW")
			},
			deleted_at: {
				type: Sequelize.DATE,
				allowNull: true
			}
		});
	},

	/**
	 * Função que desfaz a migração
	 */
	down: async (queryInterface, Sequelize) => {
		await queryInterface.dropTable("user_module_commands");
	}
};
