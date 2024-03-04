import { ILanguageCommands } from "./languageCommand";
import { LanguageCode } from "./languages";

export interface IUser {
	idUser: number;
	name: string;
	email: string;
	micOnByDefault: boolean;
	interfaceLanguage: LanguageCode;
	languageCommands: ILanguageCommands;
}
