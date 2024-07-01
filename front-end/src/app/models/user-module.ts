import { Feature } from "speakmaster-module-builder/features-builder";
import { PreferenceGroup, PreferenceValue } from "speakmaster-module-builder/preferences-builder";

import { IUserModuleCommands } from "./user-module-commands";

export interface IUserModule {
	name: string;
	idUserModule: number;
	idUser: number;
	idModule: number;
	isActive: boolean;
	userModuleCommands: IUserModuleCommands[];
	featuresDefinition: Feature[];
	preferencesDefinition: PreferenceGroup[];
	preferences: Record<string, PreferenceValue>;
}
