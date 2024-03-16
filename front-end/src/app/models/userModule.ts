import { IUserModuleCommands } from "./userModuleCommands";

export interface IUserModule {
	name: string;
	idUserModule: number;
	idUser: number;
	idModule: number;
	isActive: boolean;
	userModuleCommands: IUserModuleCommands[];
	hasNotifications?: boolean;
}
