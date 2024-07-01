import { Injectable } from "@angular/core";

import { CommandParameter, CommandParameterTypes } from "speakmaster-module-builder/default-commands-builder";
import { Feature, Parameter, ParameterValue } from "speakmaster-module-builder/features-builder";

import { TranslationPipe } from "../../pipes/translation/translation.pipe";

import { AuthenticationService } from "../authentication/authentication.service";

@Injectable({ providedIn: "root" })
export class FeaturesService {
	private readonly translationPipe: TranslationPipe;

	constructor (private readonly authenticationService: AuthenticationService) {
		this.translationPipe = new TranslationPipe(this.authenticationService);
	}

	public getFeatureName (feature: Feature): string;
	public getFeatureName (features: Feature[], featureIdentifier: string): string;
	public getFeatureName (features: Feature | Feature[], featureIdentifier?: string): string {
		const feature = Array.isArray(features) ? features.find(f => f.identifier === featureIdentifier!) : features;
		if (!feature) return "";

		return this.translationPipe.transform(feature) || feature?.identifier || featureIdentifier!;
	}

	public getFeatureDescription (feature: Feature): string;
	public getFeatureDescription (features: Feature[], featureIdentifier: string): string;
	public getFeatureDescription (features: Feature | Feature[], featureIdentifier?: string): string {
		const feature = Array.isArray(features) ? features.find(f => f.identifier === featureIdentifier!) : features;
		if (!feature) return "";

		return this.translationPipe.transform(feature, "description");
	}

	public getParameterName (feature: Feature, parameter: Parameter): string {
		return this.translationPipe.transform(parameter, feature.defaultLanguage) || parameter.identifier;
	}

	public getParameterDescription (feature: Feature, parameter: Parameter): string {
		return this.translationPipe.transform(parameter, "description", feature.defaultLanguage);
	}

	public getParameterValueName (feature: Feature, parameterValue: ParameterValue): string {
		return this.translationPipe.transform(parameterValue, feature.defaultLanguage) || parameterValue.identifier;
	}

	public getParameterValueDescription (feature: Feature, parameterValue: ParameterValue): string {
		return this.translationPipe.transform(parameterValue, "description", feature.defaultLanguage);
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
					if (allowedValue)
						value = `<span class='source-text'>${this.translationPipe.transform(allowedValue, feature.defaultLanguage) || userParameter.value}</span>`;
					else
						value = `<span class='source-text'>${userParameter.value}</span>`;
					break;
				case CommandParameterTypes.VARIABLE:
				case CommandParameterTypes.RESTRICTED_VARIABLE:
					value = `<span class='variable-text'>{${userParameter.variableName}}</span>`;
					break;
				case CommandParameterTypes.UNDEFINED:
					continue;
			}

			values.push(`<li>${this.translationPipe.transform(p, feature.defaultLanguage) || p.identifier}: ${value}</li>`);
		}

		return "<ul class='mb-0 ps-3'>" + values.join("") + "</ul>";
	}
}
