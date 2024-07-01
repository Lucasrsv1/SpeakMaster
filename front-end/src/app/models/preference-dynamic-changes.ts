import { IPreferenceUpdate, PreferenceValue } from "speakmaster-module-builder/preferences-builder";

export interface IPreferenceDynamicChanges<T extends PreferenceValue> {
	idModule: number;
	preferences: IPreferenceUpdate<T> | IPreferenceUpdate<T>[]
}
