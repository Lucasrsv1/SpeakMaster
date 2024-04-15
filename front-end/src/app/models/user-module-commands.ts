import { Command } from "speakmaster-module-builder/default-commands-builder";

export type UserModuleCommand = Command & { isActive: boolean };

export interface IUserModuleCommands {
	idUserModuleCommands?: number;
	idUserModule: number;
	language: string;
	commands: UserModuleCommand[];
	prefix: string;
	isPrefixMandated: boolean;
}
