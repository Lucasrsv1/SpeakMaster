import { OnDestroy, Pipe, PipeTransform } from "@angular/core";

import { Subscription } from "rxjs";

import { LanguageCode, Translatable } from "speakmaster-module-builder";

import { AuthenticationService } from "../../services/authentication/authentication.service";

@Pipe({
	name: "translation",
	standalone: true
})
export class TranslationPipe implements PipeTransform, OnDestroy {
	private interfaceLanguage: LanguageCode = LanguageCode.EN_US;
	private subscription: Subscription;

	constructor (private readonly authenticationService: AuthenticationService) {
		this.subscription = this.authenticationService.loggedUser$.subscribe(user => {
			this.interfaceLanguage = user ? user.interfaceLanguage : LanguageCode.EN_US;
		});
	}

	public ngOnDestroy (): void {
		this.subscription.unsubscribe();
	}

	public transform (translatable: Translatable): string;
	public transform (translatable: Translatable, target: "name" | "description"): string;
	public transform (translatable: Translatable, defaultLanguage: LanguageCode): string;
	public transform (translatable: Translatable, target: "name" | "description", defaultLanguage: LanguageCode): string

	public transform (
		translatable: Translatable,
		targetOrLanguage: "name" | "description" | LanguageCode = "name",
		defaultLanguage: LanguageCode | undefined = undefined
	): string {
		let target;
		if (targetOrLanguage === "name" || targetOrLanguage === "description") {
			target = targetOrLanguage;
		} else {
			target = "name";
			defaultLanguage = targetOrLanguage;
		}

		const translation = translatable.translations[this.interfaceLanguage] ||
			(defaultLanguage && translatable.translations[defaultLanguage as LanguageCode]) ||
			("defaultLanguage" in translatable && translatable.translations[translatable.defaultLanguage as LanguageCode]) ||
			translatable.translations[LanguageCode.EN_US];

		if (target === "name")
			return translation?.name || "";

		return translation?.description || "";
	}
}
