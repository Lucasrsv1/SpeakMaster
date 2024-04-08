import { Injectable } from "@angular/core";

import { Feature } from "speakmaster-module-builder/features-builder";
import { Match } from "speakmaster-crl";
import { Command, CommandParameterTypes } from "speakmaster-module-builder/default-commands-builder";

import { IFeatureParameters } from "../../models/featureParameters";

import { UserModulesService } from "../user-modules/user-modules.service";

@Injectable({ providedIn: "root" })
export class CommandParametersService {
	constructor (private readonly userModulesService: UserModulesService) { }

	public buildParametersObject (match: Match, idModule: number, command: Command): IFeatureParameters | undefined {
		const feature = this.getModuleFeaturesDefinition(idModule).find(f => f.identifier === command.featureIdentifier);
		if (!feature || !feature.parameters || feature.parameters.length === 0)
			return undefined;

		const parametersObj: IFeatureParameters = {};
		for (const parameter of feature.parameters) {
			const commandParameter = command.parameters?.find(p => p.identifier === parameter.identifier);
			if (!commandParameter)
				continue;

			switch (commandParameter.type) {
				case CommandParameterTypes.UNDEFINED:
					continue;
				case CommandParameterTypes.CONSTANT:
					if (commandParameter.value !== undefined)
						parametersObj[parameter.identifier] = commandParameter.value;

					break;
				case CommandParameterTypes.VARIABLE:
					if (commandParameter.variableName !== undefined)
						parametersObj[parameter.identifier] = match.variables[commandParameter.variableName];

					break;
				case CommandParameterTypes.RESTRICTED_VARIABLE:
					if (commandParameter.variableName !== undefined && commandParameter.variableValues) {
						const index = match.restrictedVariablesIndexes[commandParameter.variableName];
						parametersObj[parameter.identifier] = commandParameter.variableValues[index];
					}
					break;
			}
		}

		return parametersObj;
	}

	private getModuleFeaturesDefinition (idModule: number): Feature[] {
		return this.userModulesService.userModules?.find(module => module.idModule === idModule)?.featuresDefinition || [];
	}
}
