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
			await queryInterface.addColumn("module", "id_author", {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: { model: "user", key: "id_user" }
			}, { transaction });

			await queryInterface.addColumn("module", "api_key", {
				type: Sequelize.UUID,
				allowNull: false
			}, { transaction });

			await queryInterface.addColumn("module", "api_secret", {
				type: Sequelize.STRING(256),
				allowNull: false
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
			await queryInterface.removeColumn("module", "api_secret", { transaction });
			await queryInterface.removeColumn("module", "api_key", { transaction });
			await queryInterface.removeColumn("module", "id_author", { transaction });
			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}
};
