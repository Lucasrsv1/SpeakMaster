import { Injectable } from "@angular/core";

const APP_KEY_PREFIX = "SPEAKMASTER_";

export enum LocalStorageKey {
	USER = "USER",
	LANGUAGE_COMMANDS = "LANGUAGE_COMMANDS"
}

@Injectable({ providedIn: "root" })
export class LocalStorageService {
	constructor () { }

	public hasKey (key: LocalStorageKey, suffix: string = ""): boolean {
		return Boolean(this.get(key, null, suffix));
	}

	public get (key: LocalStorageKey, defaultValue: any = null, suffix: string = ""): string {
		return window.localStorage.getItem(APP_KEY_PREFIX + key + suffix) || defaultValue;
	}

	public parse<T> (key: LocalStorageKey, defaultValue: T | null = null, suffix: string = ""): T | null {
		const content: string | null = window.localStorage.getItem(APP_KEY_PREFIX + key + suffix);
		if (!content)
			return defaultValue;

		return JSON.parse(content) as T;
	}

	public set (key: LocalStorageKey, value: string, suffix: string = ""): void {
		window.localStorage.setItem(APP_KEY_PREFIX + key + suffix, value);
	}

	public delete (key: LocalStorageKey, suffix: string = ""): void {
		window.localStorage.removeItem(APP_KEY_PREFIX + key + suffix);
	}
}
