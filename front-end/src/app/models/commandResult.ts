import { IAmbiguity } from "./ambiguity";
import { IFeatureParameters } from "./featureParameters";

export interface ICommandResult {
	idModule: number;
	featureIdentifier: string;
	sentAt: number;
	result: boolean | {
		options: IAmbiguity[];
		parameters?: IFeatureParameters;
		notified?: boolean;
	};
}
