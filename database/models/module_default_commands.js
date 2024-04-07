const { Model, DataTypes } = require("sequelize");

class ModuleDefaultCommands extends Model {
	/**
	 * Cria as associações entre as tabelas do banco de dados
	 * @param {import("./index")} models Modelos das tabelas do banco de dados
	 */
	static associate (models) {
		ModuleDefaultCommands.belongsTo(models.Module, { as: "module", foreignKey: "idModule" });
	}
}

/**
 * Cria o modelo da tabela itens
 * @param {import("sequelize/types").Sequelize} sequelize
 */
function initModuleDefaultCommands (sequelize) {
	ModuleDefaultCommands.init({
		idModuleDefaultCommands: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false
		},
		idModule: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		language: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		commands: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		}
	}, {
		sequelize,
		paranoid: true,
		timestamps: true,
		underscored: true,
		modelName: "ModuleDefaultCommands",
		tableName: "module_default_commands"
	});

	return ModuleDefaultCommands;
}

module.exports = initModuleDefaultCommands;
