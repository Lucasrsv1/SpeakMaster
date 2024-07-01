import { PreferenceValue } from "speakmaster-module-builder/preferences-builder";

export interface IPreferenceValueUpdate {
	identifier: string;
	value: PreferenceValue;
}
