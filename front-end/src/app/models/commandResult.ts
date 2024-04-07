import { IAmbiguity } from "./ambiguity";
import { IFeatureParameters } from "./featureParameters";

export interface ICommandResult {
	idModule: number;
	featureKey: string;
	sentAt: number;
	result: boolean | {
		options: IAmbiguity[];
		parameters: IFeatureParameters;
	};
}
