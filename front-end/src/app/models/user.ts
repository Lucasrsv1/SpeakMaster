export interface IUser {
	idUser: number;
	name: string;
	email: string;
	micOnByDefault: boolean;

	// TODO: criar uma enumeração para os idiomas suportados
	interfaceLanguage: string;

	// TODO: criar uma interface para os comandos de cada linguagem
	languageCommands: object[];
}
