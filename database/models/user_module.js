const { Model, DataTypes } = require("sequelize");

class UserModule extends Model {
	/**
	 * Cria as associações entre as tabelas do banco de dados
	 * @param {import("./index")} models Modelos das tabelas do banco de dados
	 */
	static associate (models) {
		UserModule.hasMany(models.UserModuleCommands, { as: "userModuleCommands", foreignKey: "idUserModule" });
		UserModule.belongsTo(models.User, { as: "user", foreignKey: "idUser" });
		UserModule.belongsTo(models.Module, { as: "module", foreignKey: "idModule" });
	}
}

/**
 * Cria o modelo da tabela
 * @param {import("sequelize/types").Sequelize} sequelize
 */
function initUserModule (sequelize) {
	UserModule.init({
		idUserModule: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false
		},
		idUser: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		idModule: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		preferences: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		}
	}, {
		sequelize,
		paranoid: true,
		timestamps: true,
		underscored: true,
		modelName: "UserModule",
		tableName: "user_module"
	});

	return UserModule;
}

module.exports = initUserModule;
