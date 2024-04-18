import { Command } from "speakmaster-module-builder/default-commands-builder";

export interface IModuleDefaultCommands {
	idModuleDefaultCommands: number;
	idModule: number;
	language: string;
	commands: Command[];
}
