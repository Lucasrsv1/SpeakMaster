const { Model, DataTypes } = require("sequelize");

class Module extends Model {
	/**
	 * Cria as associações entre as tabelas do banco de dados
	 * @param {import("./index")} models Modelos das tabelas do banco de dados
	 */
	static associate (models) {
		Module.hasMany(models.UserModule, { as: "userModules", foreignKey: "idModule" });
		Module.belongsToMany(models.User, { as: "users", through: models.UserModule });
	}
}

/**
 * Cria o modelo da tabela itens
 * @param {import("sequelize/types").Sequelize} sequelize
 */
function initModule (sequelize) {
	Module.init({
		idModule: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING(200),
			allowNull: false
		},
		preferencesDefinition: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: "[]"
		}
	}, {
		sequelize,
		paranoid: true,
		timestamps: true,
		underscored: true,
		modelName: "Module",
		tableName: "module"
	});

	return Module;
}

module.exports = initModule;
