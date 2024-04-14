import { IFeatureParameters } from "./feature-parameters";

export interface IAmbiguity {
	description: string;
	value: IFeatureParameters;
	image?: string;
	isSelected?: boolean;
	secondaryInfo?: string;
}
