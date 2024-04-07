const { Model, DataTypes } = require("sequelize");

class UserModuleCommands extends Model {
	/**
	 * Cria as associações entre as tabelas do banco de dados
	 * @param {import("./index")} models Modelos das tabelas do banco de dados
	 */
	static associate (models) {
		UserModuleCommands.belongsTo(models.UserModule, { as: "userModule", foreignKey: "idUserModule" });
	}
}

/**
 * Cria o modelo da tabela itens
 * @param {import("sequelize/types").Sequelize} sequelize
 */
function initUserModuleCommands (sequelize) {
	UserModuleCommands.init({
		idUserModuleCommands: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false
		},
		idUserModule: {
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
		},
		prefix: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		isPrefixMandated: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}, {
		sequelize,
		paranoid: true,
		timestamps: true,
		underscored: true,
		modelName: "UserModuleCommands",
		tableName: "user_module_commands"
	});

	return UserModuleCommands;
}

module.exports = initUserModuleCommands;
