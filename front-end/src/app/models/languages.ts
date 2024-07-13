import { LanguageCode } from "speakmaster-module-builder";

export interface ILanguage {
	name: string;
	code: LanguageCode;
}

export const languages: ILanguage[] = [
	{ name: "العربية (المملكة العربية السعودية)", code: LanguageCode.AR_SA },
	{ name: "Čeština (Česká republika)", code: LanguageCode.CS_CZ },
	{ name: "Dansk (Danmark)", code: LanguageCode.DA_DK },
	{ name: "Deutsch (Deutschland)", code: LanguageCode.DE_DE },
	{ name: "Νέα Ελληνικά (Ελλάδα)", code: LanguageCode.EL_GR },
	{ name: "English (Australia)", code: LanguageCode.EN_AU },
	{ name: "English (United Kingdom)", code: LanguageCode.EN_GB },
	{ name: "English (Ireland)", code: LanguageCode.EN_IE },
	{ name: "English (United States)", code: LanguageCode.EN_US },
	{ name: "English (South Africa)", code: LanguageCode.EN_ZA },
	{ name: "Español (España)", code: LanguageCode.ES_ES },
	{ name: "Español (Mexico)", code: LanguageCode.ES_MX },
	{ name: "Suomi (Suomi)", code: LanguageCode.FI_FI },
	{ name: "Français (Canada)", code: LanguageCode.FR_CA },
	{ name: "Français (France)", code: LanguageCode.FR_FR },
	{ name: "עברית (ישראל)", code: LanguageCode.HE_IL },
	{ name: "हिंदी (भारत)", code: LanguageCode.HI_IN },
	{ name: "Magyar (Magyarország)", code: LanguageCode.HU_HU },
	{ name: "Indonesia (Indonesia)", code: LanguageCode.ID_ID },
	{ name: "Italiano (Italia)", code: LanguageCode.IT_IT },
	{ name: "日本語（日本）", code: LanguageCode.JA_JP },
	{ name: "한국어(대한민국)", code: LanguageCode.KO_KR },
	{ name: "Nederlands (België)", code: LanguageCode.NL_BE },
	{ name: "Nederlands (Nederland)", code: LanguageCode.NL_NL },
	{ name: "Norsk (Norge)", code: LanguageCode.NO_NO },
	{ name: "Polski (Polska)", code: LanguageCode.PL_PL },
	{ name: "Português (Brasil)", code: LanguageCode.PT_BR },
	{ name: "Português (Portugal)", code: LanguageCode.PT_PT },
	{ name: "Română (Romania)", code: LanguageCode.RO_RO },
	{ name: "Русский (Российская Федерация)", code: LanguageCode.RU_RU },
	{ name: "Slovenčina (Slovensko)", code: LanguageCode.SK_SK },
	{ name: "Svenska (Sverige)", code: LanguageCode.SV_SE },
	{ name: "ไทย (ประเทศไทย)", code: LanguageCode.TH_TH },
	{ name: "Türkçe (Türkiye)", code: LanguageCode.TR_TR },
	{ name: "中文（中国）", code: LanguageCode.ZH_CN },
	{ name: "中文（香港）", code: LanguageCode.ZH_HK },
	{ name: "中文（台湾）", code: LanguageCode.ZH_TW }
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
