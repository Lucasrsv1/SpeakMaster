import { Injectable, OnDestroy } from "@angular/core";

import { CommandParameter, CommandParameterTypes } from "speakmaster-module-builder/default-commands-builder";
import { Feature, Parameter, ParameterValue, Translations } from "speakmaster-module-builder/features-builder";

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

	public getFeatureName (feature: Feature): string;
	public getFeatureName (features: Feature[], featureIdentifier: string): string;
	public getFeatureName (features: Feature | Feature[], featureIdentifier?: string): string {
		const feature = Array.isArray(features) ? features.find(f => f.identifier === featureIdentifier!) : features;
		if (!feature) return "";

		const translation = this.getTranslation(feature);
		return translation?.name || feature?.identifier || featureIdentifier!;
	}

	public getFeatureDescription (feature: Feature): string;
	public getFeatureDescription (features: Feature[], featureIdentifier: string): string;
	public getFeatureDescription (features: Feature | Feature[], featureIdentifier?: string): string {
		const feature = Array.isArray(features) ? features.find(f => f.identifier === featureIdentifier!) : features;
		if (!feature) return "";

		const translation = this.getTranslation(feature);
		return translation?.description || "";
	}

	public getParameterName (feature: Feature, parameter: Parameter): string {
		const translation = this.getTranslation(feature, parameter.translations);
		return translation?.name || parameter.identifier;
	}

	public getParameterDescription (feature: Feature, parameter: Parameter): string {
		const translation = this.getTranslation(feature, parameter.translations);
		return translation?.description || "";
	}

	public getParameterValueName (feature: Feature, parameterValue: ParameterValue): string {
		const translation = this.getTranslation(feature, parameterValue.translations);
		return translation?.name || parameterValue.identifier;
	}

	public getParameterValueDescription (feature: Feature, parameterValue: ParameterValue): string {
		const translation = this.getTranslation(feature, parameterValue.translations);
		return translation?.description || "";
	}

	public getFeatureParameters (features: Feature[], featureIdentifier: string, parameters: CommandParameter[] | undefined): string {
		const feature = features.find(f => f.identifier === featureIdentifier);
		if (!feature)
			return "<ul class='mb-0 ps-3'></ul>";

		const values: string[] = [];
		for (const p of feature.parameters) {
			let value = "";
			const userParameter = parameters?.find(p2 => p2.identifier === p.identifier);
			if (!userParameter)
				continue;

			const allowedValue = p.allowedValues.find(v => v.identifier === userParameter.value);
			switch (userParameter.type) {
				case CommandParameterTypes.CONSTANT:
					if (allowedValue) {
						const translation = this.getTranslation(feature, allowedValue.translations);
						value = `<span class='source-text'>${translation?.name || userParameter.value}</span>`;
					} else {
						value = `<span class='source-text'>${userParameter.value}</span>`;
					}
					break;
				case CommandParameterTypes.VARIABLE:
				case CommandParameterTypes.RESTRICTED_VARIABLE:
					value = `<span class='variable-text'>{${userParameter.variableName}}</span>`;
					break;
				case CommandParameterTypes.UNDEFINED:
					continue;
			}

			const translation = this.getTranslation(feature, p.translations);
			values.push(`<li>${translation?.name || p.identifier}: ${value}</li>`);
		}

		return "<ul class='mb-0 ps-3'>" + values.join("") + "</ul>";
	}

	private getTranslation (feature: Feature, translations?: Translations) {
		if (!translations)
			translations = feature.translations;

		return translations[this.interfaceLanguage] ||
			translations[feature.defaultLanguage] ||
			translations[LanguageCode.EN_US];
	}
}
