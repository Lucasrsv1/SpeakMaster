import { IAmbiguity } from "./ambiguity";
import { IFeatureParameters } from "./feature-parameters";

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
