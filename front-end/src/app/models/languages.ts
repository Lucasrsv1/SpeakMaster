export enum LanguageCode {
	DE_DE = "de-DE",
	EN_GB = "en-GB",
	EN_US = "en-US",
	ES_ES = "es-ES",
	FR_FR = "fr-FR",
	IT_IT = "it-IT",
	PT_BR = "pt-BR",
	PT_PT = "pt-PT"
}

export interface ILanguage {
	name: string;
	code: LanguageCode;
}

export const languages: ILanguage[] = [
	{ name: "Deutsch (Deutschland)", code: LanguageCode.DE_DE },
	{ name: "English (United Kingdom)", code: LanguageCode.EN_GB },
	{ name: "English (United States)", code: LanguageCode.EN_US },
	{ name: "Español (España)", code: LanguageCode.ES_ES },
	{ name: "Français (France)", code: LanguageCode.FR_FR },
	{ name: "Italiano (Italia)", code: LanguageCode.IT_IT },
	{ name: "Português (Brasil)", code: LanguageCode.PT_BR },
	{ name: "Português (Portugal)", code: LanguageCode.PT_PT }
].sort(
	(a, b) => a.name.localeCompare(b.name)
);

export function getDefaultLanguage (): LanguageCode {
	// Get browser language
	const browserLanguage = navigator.language || (navigator as any).userLanguage;

	// Get default language based on browser language
	const defaultLanguage = languages.find(
		language => language.code === browserLanguage
	);

	return defaultLanguage ? defaultLanguage.code : LanguageCode.PT_BR;
}
