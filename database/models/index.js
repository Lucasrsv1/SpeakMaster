"use strict";

const Sequelize = require("sequelize");

const configs = require("../config/config");

const initModule = require("./module");
const initModuleDefaultCommands = require("./module_default_commands");
const initUser = require("./user");
const initUserModule = require("./user_module");
const initUserModuleCommands = require("./user_module_commands");

const env = process.env.NODE_ENV || "development";
const config = configs[env];

if (config.logging)
	config.logging = console.log;

config.pool = {
	max: 20,
	min: 0,
	idle: 5000,
	evict: 5000
};

/**
 * @type {Sequelize} conexão com o banco de dados
 */
let sequelize;

// Se houver variável de ambiente com a string de conexão do banco de dados (como no Heroku)
if (config.use_env_variable)
	sequelize = new Sequelize(process.env[config.use_env_variable], config);
else
	sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {
	sequelize,

	// Carrega arquivos de modelos das tabelas
	Module: initModule(sequelize),
	ModuleDefaultCommands: initModuleDefaultCommands(sequelize),
	User: initUser(sequelize),
	UserModule: initUserModule(sequelize),
	UserModuleCommands: initUserModuleCommands(sequelize)
};

// Cria as associações das tabelas
Object.keys(db).forEach(modelName => {
	if ("associate" in db[modelName])
		db[modelName].associate(db);
});

// Testa a conexão com o banco de dados
db.sequelize.authenticate()
	.then(_ => console.log("Database connected."))
	.catch(console.error);

module.exports = db;
