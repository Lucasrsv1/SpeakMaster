"use strict";

/**
 * @type {import("sequelize-cli").Migration}
 */
module.exports = {
	/**
	 * Função de aplicação da migração
	 */
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable("user", {
			id_user: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			name: {
				type: Sequelize.STRING(200),
				allowNull: false
			},
			email: {
				type: Sequelize.STRING(100),
				allowNull: false
			},
			password: {
				type: Sequelize.STRING(256),
				allowNull: false
			},
			mic_on_by_default: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			interface_language: {
				type: Sequelize.STRING(20),
				allowNull: false,
				defaultValue: "pt-BR"
			},
			language_commands: {
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
		await queryInterface.dropTable("user");
	}
};
