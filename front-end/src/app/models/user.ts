import { LanguageCode } from "speakmaster-module-builder";

export interface IUser {
	idUser: number;
	name: string;
	email: string;
	micOnByDefault: boolean;
	interfaceLanguage: LanguageCode;
}
