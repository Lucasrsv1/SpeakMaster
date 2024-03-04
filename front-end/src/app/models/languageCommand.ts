import { LanguageCode } from "./languages";

export interface ILanguageCommand {
	targetLanguageCode: LanguageCode;
	command: string;
	isActive: boolean;
}

export interface ILanguageCommands extends Partial<{
	[spokenLanguageCode in LanguageCode]: ILanguageCommand[];
}> {
	languagesToListen: LanguageCode[]
}

export function getDefaultCommandForLanguage (fromLanguage: LanguageCode, toLanguage: LanguageCode): string {
	switch (fromLanguage) {
		case LanguageCode.DE_DE:
			switch (toLanguage) {
				case LanguageCode.EN_US:
					return "Sprache auf [amerikanisches] Englisch umstellen";
				case LanguageCode.EN_GB:
					return "Sprache auf britisches Englisch umstellen";
				case LanguageCode.ES_ES:
					return "Sprache auf Spanisch umstellen";
				case LanguageCode.FR_FR:
					return "Sprache auf Französisch umstellen";
				case LanguageCode.IT_IT:
					return "Sprache auf Italienisch umstellen";
				case LanguageCode.PT_BR:
					return "Sprache auf brasilianisches Portugiesisch umstellen";
				case LanguageCode.PT_PT:
					return "Sprache auf Portugiesisch umstellen";
			}
			break;
		case LanguageCode.EN_US:
		case LanguageCode.EN_GB:
			switch (toLanguage) {
				case LanguageCode.DE_DE:
					return "(listen [(to, in)], switch [language] [to]) german";
				case LanguageCode.EN_US:
					return "(listen [(to, in)], switch [language] [to]) [american] english";
				case LanguageCode.EN_GB:
					return "(listen [(to, in)], switch [language] [to]) british english";
				case LanguageCode.ES_ES:
					return "(listen [(to, in)], switch [language] [to]) spanish";
				case LanguageCode.FR_FR:
					return "(listen [(to, in)], switch [language] [to]) french";
				case LanguageCode.IT_IT:
					return "(listen [(to, in)], switch [language] [to]) italian";
				case LanguageCode.PT_BR:
					return "(listen [(to, in)], switch [language] [to]) brazilian portuguese";
				case LanguageCode.PT_PT:
					return "(listen [(to, in)], switch [language] [to]) portuguese";
			}
			break;
		case LanguageCode.ES_ES:
			switch (toLanguage) {
				case LanguageCode.DE_DE:
					return "cambiar [[el] idioma] [(a, al)] alemán";
				case LanguageCode.EN_US:
					return "cambiar [[el] idioma] [(a, al)] inglés [americano]";
				case LanguageCode.EN_GB:
					return "cambiar [[el] idioma] [(a, al)] inglés británico";
				case LanguageCode.FR_FR:
					return "cambiar [[el] idioma] [(a, al)] francés";
				case LanguageCode.IT_IT:
					return "cambiar [[el] idioma] [(a, al)] italiano";
				case LanguageCode.PT_BR:
					return "cambiar [[el] idioma] [(a, al)] portugués brasileño";
				case LanguageCode.PT_PT:
					return "cambiar [[el] idioma] [(a, al)] portugués";
			}
			break;
		case LanguageCode.FR_FR:
			switch (toLanguage) {
				case LanguageCode.DE_DE:
					return "changer de langue en allemand";
				case LanguageCode.EN_US:
					return "changer de langue en anglais [américain]";
				case LanguageCode.EN_GB:
					return "changer de langue en anglais britannique";
				case LanguageCode.ES_ES:
					return "changer de langue en espagnol";
				case LanguageCode.IT_IT:
					return "changer de langue en italien";
				case LanguageCode.PT_BR:
					return "changer de langue en portugais brésilien";
				case LanguageCode.PT_PT:
					return "changer de langue en portugais";
			}
			break;
		case LanguageCode.IT_IT:
			switch (toLanguage) {
				case LanguageCode.DE_DE:
					return "cambia [la] lingua in tedesco";
				case LanguageCode.EN_US:
					return "cambia [la] lingua in inglese [americano]";
				case LanguageCode.EN_GB:
					return "cambia [la] lingua in inglese britannico";
				case LanguageCode.ES_ES:
					return "cambia [la] lingua in spagnolo";
				case LanguageCode.FR_FR:
					return "cambia [la] lingua in francese";
				case LanguageCode.PT_BR:
					return "cambia [la] lingua in portoghese brasiliano";
				case LanguageCode.PT_PT:
					return "cambia [la] lingua in portoghese";
			}
			break;
		case LanguageCode.PT_BR:
		case LanguageCode.PT_PT:
			switch (toLanguage) {
				case LanguageCode.DE_DE:
					return "(ouvir [em], trocar [idioma] [para]) alemão";
				case LanguageCode.EN_US:
					return "(ouvir [em], trocar [idioma] [para]) inglês [americano]";
				case LanguageCode.EN_GB:
					return "(ouvir [em], trocar [idioma] [para]) inglês britânico";
				case LanguageCode.ES_ES:
					return "(ouvir [em], trocar [idioma] [para]) espanhol";
				case LanguageCode.FR_FR:
					return "(ouvir [em], trocar [idioma] [para]) francês";
				case LanguageCode.IT_IT:
					return "(ouvir [em], trocar [idioma] [para]) italiano";
				case LanguageCode.PT_BR:
					return "(ouvir [em], trocar [idioma] [para]) português [brasileiro]";
				case LanguageCode.PT_PT:
					return "(ouvir [em], trocar [idioma] [para]) português [de] Portugal";
			}
	}

	return "";
}
