import { LanguageCode } from "./languages";

export interface IUser {
	idUser: number;
	name: string;
	email: string;
	micOnByDefault: boolean;
	interfaceLanguage: LanguageCode;

	// TODO: criar uma interface para os comandos de cada linguagem
	languageCommands: object[];
}
