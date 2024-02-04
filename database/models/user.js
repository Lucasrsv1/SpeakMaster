const { Model, DataTypes } = require("sequelize");

class User extends Model {
	/**
	 * Cria as associações entre as tabelas do banco de dados
	 * @param {import("./index")} models Modelos das tabelas do banco de dados
	 */
	static associate (models) {
		User.hasMany(models.UserModule, { as: "userModules", foreignKey: "idUser" });
		User.belongsToMany(models.Module, { as: "modules", through: models.UserModule });
	}
}

/**
 * Cria o modelo da tabela itens
 * @param {import("sequelize/types").Sequelize} sequelize
 */
function initUser (sequelize) {
	User.init({
		idUser: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING(200),
			allowNull: false
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		password: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		micOnByDefault: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		interfaceLanguage: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: "pt-BR"
		},
		languageCommands: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: "[]"
		}
	}, {
		sequelize,
		paranoid: true,
		timestamps: true,
		underscored: true,
		modelName: "User",
		tableName: "user"
	});

	return User;
}

module.exports = initUser;
