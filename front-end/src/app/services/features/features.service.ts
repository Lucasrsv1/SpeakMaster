import { Injectable, OnDestroy } from "@angular/core";

import { Feature } from "speakmaster-module-builder/features-builder";
import { CommandParameter, CommandParameterTypes } from "speakmaster-module-builder/default-commands-builder";

import { Subscription } from "rxjs";

import { LanguageCode } from "../../models/languages";

import { AuthenticationService } from "../authentication/authentication.service";

@Injectable({ providedIn: "root" })
export class FeaturesService implements OnDestroy {
	private interfaceLanguage: LanguageCode = LanguageCode.EN_US;
	private subscription: Subscription;

	constructor (private readonly authenticationService: AuthenticationService) {
		this.subscription = this.authenticationService.$loggedUser.subscribe(user => {
			this.interfaceLanguage = user ? user.interfaceLanguage : LanguageCode.EN_US;
		});
	}

	public ngOnDestroy (): void {
		this.subscription.unsubscribe();
	}

	public getFeatureName (features: Feature[], featureIdentifier: string): string {
		const feature = features.find(f => f.identifier === featureIdentifier);
		const translation = feature?.translations[this.interfaceLanguage] ||
							feature?.translations[feature.defaultLanguage] ||
							feature?.translations[LanguageCode.EN_US];

		return translation?.name || featureIdentifier;
	}

	public getFeatureParameters (features: Feature[], featureIdentifier: string, parameters: CommandParameter[] | undefined): string[] {
		const feature = features.find(f => f.identifier === featureIdentifier);
		if (!feature)
			return [];

		const values: string[] = [];
		for (const p of feature.parameters) {
			let value = "";
			const userParameter = parameters?.find(p2 => p2.identifier === p.identifier);
			if (!userParameter)
				continue;

			switch (userParameter.type) {
				case CommandParameterTypes.CONSTANT:
					value = `<span class='source-text'>${userParameter.value}</span>`;
					break;
				case CommandParameterTypes.VARIABLE:
				case CommandParameterTypes.RESTRICTED_VARIABLE:
					value = `<span class='variable-text'>{${userParameter.variableName}}</span>`;
					break;
				case CommandParameterTypes.UNDEFINED:
					continue;
			}

			const translation = p.translations[this.interfaceLanguage] ||
								p.translations[feature.defaultLanguage] ||
								p.translations[LanguageCode.EN_US];

			values.push(`<li>${translation?.name || p.identifier}: ${value}</li>`);
		}

		return values;
	}
}
