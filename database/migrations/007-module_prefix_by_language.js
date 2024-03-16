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
			await queryInterface.removeColumn("user_module", "prefix", { transaction });
			await queryInterface.removeColumn("user_module", "is_prefix_mandated", { transaction });

			await queryInterface.addColumn("user_module_commands", "prefix", {
				type: Sequelize.TEXT,
				allowNull: true
			}, { transaction });

			await queryInterface.addColumn("user_module_commands", "is_prefix_mandated", {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false
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
			await queryInterface.removeColumn("user_module_commands", "prefix", { transaction });
			await queryInterface.removeColumn("user_module_commands", "is_prefix_mandated", { transaction });

			await queryInterface.addColumn("user_module", "prefix", {
				type: Sequelize.TEXT,
				allowNull: true
			}, { transaction });

			await queryInterface.addColumn("user_module", "is_prefix_mandated", {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false
			}, { transaction });

			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}
};
