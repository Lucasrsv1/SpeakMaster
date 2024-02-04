"use strict";

/**
 * @type {import("sequelize-cli").Migration}
 */
module.exports = {
	/**
	 * Função de aplicação da migração
	 */
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable("user_module", {
			id_user_module: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			id_user: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: { model: "user", key: "id_user" }
			},
			id_module: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: { model: "module", key: "id_module" }
			},
			is_active: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true
			},
			prefix: {
				type: Sequelize.TEXT,
				allowNull: true
			},
			is_prefix_mandated: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			preferences: {
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
		await queryInterface.dropTable("user_module");
	}
};
