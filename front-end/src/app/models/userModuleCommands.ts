import { ICommand } from "./command";

export interface IUserModuleCommands {
	idUserModuleCommands: number;
	idUserModule: number;
	language: string;
	commands: ICommand[];
}
