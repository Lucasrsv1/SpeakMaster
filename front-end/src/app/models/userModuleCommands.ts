import { Command } from "speakmaster-module-builder/default-commands-builder";

export interface IUserModuleCommands {
	idUserModuleCommands?: number;
	idUserModule: number;
	language: string;
	commands: Command[];
	prefix: string;
	isPrefixMandated: boolean;
}
