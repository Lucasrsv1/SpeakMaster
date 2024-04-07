import { IFeatureParameters } from "./featureParameters";

export interface IAmbiguity {
	description: string;
	value: IFeatureParameters;
	image?: string;
	isSelected?: boolean;
	secondaryInfo?: string;
}
