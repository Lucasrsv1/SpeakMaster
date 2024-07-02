import { LanguageCode } from "speakmaster-module-builder";

export interface ILanguage {
	name: string;
	code: LanguageCode;
}

export const languages: ILanguage[] = [
	// { name: "Arabic (Saudi Arabia)", code: LanguageCode.AR_SA },
	// { name: "Czech (Czech Republic)", code: LanguageCode.CS_CZ },
	// { name: "Danish (Denmark)", code: LanguageCode.DA_DK },
	{ name: "Deutsch (Deutschland)", code: LanguageCode.DE_DE },
	// { name: "Modern Greek (Greece)", code: LanguageCode.EL_GR },
	// { name: "English (Australia)", code: LanguageCode.EN_AU },
	{ name: "English (United Kingdom)", code: LanguageCode.EN_GB },
	// { name: "English (Ireland)", code: LanguageCode.EN_IE },
	{ name: "English (United States)", code: LanguageCode.EN_US },
	// { name: "English (South Africa)", code: LanguageCode.EN_ZA },
	{ name: "Español (España)", code: LanguageCode.ES_ES },
	// { name: "Spanish (Mexico)", code: LanguageCode.ES_MX },
	// { name: "Finnish (Finland)", code: LanguageCode.FI_FI },
	// { name: "French (Canada)", code: LanguageCode.FR_CA },
	{ name: "Français (France)", code: LanguageCode.FR_FR },
	// { name: "Hebrew (Israel)", code: LanguageCode.HE_IL },
	// { name: "Hindi (India)", code: LanguageCode.HI_IN },
	// { name: "Hungarian (Hungary)", code: LanguageCode.HU_HU },
	// { name: "Indonesian (Indonesia)", code: LanguageCode.ID_ID },
	{ name: "Italiano (Italia)", code: LanguageCode.IT_IT },
	// { name: "Japanese (Japan)", code: LanguageCode.JA_JP },
	// { name: "Korean (Republic of Korea)", code: LanguageCode.KO_KR },
	// { name: "Dutch (Belgium)", code: LanguageCode.NL_BE },
	// { name: "Dutch (Netherlands)", code: LanguageCode.NL_NL },
	// { name: "Norwegian (Norway)", code: LanguageCode.NO_NO },
	// { name: "Polish (Poland)", code: LanguageCode.PL_PL },
	{ name: "Português (Brasil)", code: LanguageCode.PT_BR },
	{ name: "Português (Portugal)", code: LanguageCode.PT_PT }
	// { name: "Romanian (Romania)", code: LanguageCode.RO_RO },
	// { name: "Russian (Russian Federation)", code: LanguageCode.RU_RU },
	// { name: "Slovak (Slovakia)", code: LanguageCode.SK_SK },
	// { name: "Swedish (Sweden)", code: LanguageCode.SV_SE },
	// { name: "Thai (Thailand)", code: LanguageCode.TH_TH },
	// { name: "Turkish (Turkey)", code: LanguageCode.TR_TR },
	// { name: "Chinese (China)", code: LanguageCode.ZH_CN },
	// { name: "Chinese (Hong Kong)", code: LanguageCode.ZH_HK },
	// { name: "Chinese (Taiwan)", code: LanguageCode.ZH_TW }
].sort(
	(a, b) => a.name.localeCompare(b.name)
);

export const interfaceLanguages: LanguageCode[] = [
	LanguageCode.EN_US,
	LanguageCode.PT_BR
];

export function getLanguageNameByCode (code: LanguageCode): string | undefined {
	return languages.find(l => l.code === code)?.name;
}

export function getDefaultLanguage (): LanguageCode {
	// Get browser language
	const browserLanguage = navigator.language || (navigator as any).userLanguage;

	// Get default language based on browser language
	const defaultLanguage = languages.find(
		language => language.code === browserLanguage
	);

	return defaultLanguage ? defaultLanguage.code : LanguageCode.PT_BR;
}
